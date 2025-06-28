const Blog = require('../models/Blog');
const User = require('../../models/User');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Configure cache
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

// Configure rate limiter
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many image uploads, please try again later'
});

// Validate blog data
const validateBlogData = (data) => {
  const errors = [];
  if (!data.title?.trim()) errors.push('Title is required');
  if (!data.content?.trim()) errors.push('Content is required');
  if (!data.excerpt?.trim()) errors.push('Excerpt is required');
  if (!data.metaTitle?.trim()) errors.push('Meta title is required');
  if (!data.metaDescription?.trim()) errors.push('Meta description is required');
  if (!data.keywords?.length) errors.push('At least one keyword is required');
  if (data.status === 'published' && !data.bannerImage) {
    errors.push('Banner image is required for published blogs');
  }
  return errors;
};

// Delete image from S3
const deleteImageFromS3 = async (imageUrl) => {
  try {
    const key = imageUrl.split('/').pop();
    await s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `blog-images/${key}`
    }).promise();
  } catch (error) {
    console.error('Error deleting image from S3:', error);
  }
};

// Get all blogs for admin (including drafts)
exports.getAdminBlogs = async (req, res) => {
  try {
    const { status, sort = '-createdAt' } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const blogs = await Blog.find(query)
      .sort(sort)
      .populate('author', 'name');
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all published blogs with search and filter
exports.getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const sort = req.query.sort || '-publishedAt';

    // Check cache
    const cacheKey = `blogs_${page}_${limit}_${search}_${sort}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const query = { status: 'published' };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const blogs = await Blog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('author', 'name');

    const total = await Blog.countDocuments(query);

    const response = {
      blogs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlogs: total
    };

    // Cache the response
    cache.set(cacheKey, response);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single blog by slug
exports.getBlogBySlug = async (req, res) => {
  try {
    // Check cache
    const cacheKey = `blog_${req.params.slug}`;
    const cachedBlog = cache.get(cacheKey);
    if (cachedBlog) {
      return res.json(cachedBlog);
    }

    const blog = await Blog.findOne({ 
      slug: req.params.slug,
      status: 'published'
    }).populate('author', 'name');

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Cache the blog
    cache.set(cacheKey, blog);
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new blog
exports.createBlog = async (req, res) => {
  try {
    const errors = validateBlogData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(', ') });
    }

    const blog = new Blog({
      ...req.body,
      author: req.user._id
    });

    const savedBlog = await blog.save();
    res.status(201).json(savedBlog);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A blog with this title already exists' });
    }
    res.status(400).json({ message: error.message });
  }
};

// Update blog
exports.updateBlog = async (req, res) => {
  try {
    const errors = validateBlogData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(', ') });
    }

    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Admin can update any blog
    if (req.user.role !== 'admin' && blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // If banner image is being updated, delete the old one
    if (req.body.bannerImage && blog.bannerImage !== req.body.bannerImage) {
      await deleteImageFromS3(blog.bannerImage);
    }

    Object.assign(blog, req.body);
    const updatedBlog = await blog.save();

    // Clear cache
    cache.del(`blog_${blog.slug}`);
    cache.del(`blogs_*`);

    res.json(updatedBlog);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A blog with this title already exists' });
    }
    res.status(400).json({ message: error.message });
  }
};

// Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Admin can delete any blog
    if (req.user.role !== 'admin' && blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete banner image from S3
    if (blog.bannerImage) {
      await deleteImageFromS3(blog.bannerImage);
    }

    await blog.deleteOne();

    // Clear cache
    cache.del(`blog_${blog.slug}`);
    cache.del(`blogs_*`);

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload image to S3
exports.uploadImage = [
  uploadLimiter,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const file = req.file;
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;

      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `blog-images/${fileName}`,
        Body: file.buffer,
        ContentType: file.mimetype
      };

      const result = await s3.upload(params).promise();
      res.json({ url: result.Location });
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
      }
      res.status(500).json({ message: 'Failed to upload image. Please try again.' });
    }
  }
];

// Get single blog by ID for admin
exports.getAdminBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'name');

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 