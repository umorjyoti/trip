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

// Generate sitemap XML
const generateSitemap = (blogs, baseUrl) => {
  const currentDate = new Date().toISOString();
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/blogs</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/treks</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;

  // Add blog URLs
  blogs.forEach(blog => {
    sitemap += `
  <url>
    <loc>${baseUrl}/blogs/${blog.slug}</loc>
    <lastmod>${new Date(blog.updatedAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  sitemap += `
</urlset>`;

  return sitemap;
};

// Get sitemap
exports.getSitemap = async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    
    // Check cache
    const cacheKey = 'sitemap';
    const cachedSitemap = cache.get(cacheKey);
    if (cachedSitemap) {
      res.set('Content-Type', 'application/xml');
      return res.send(cachedSitemap);
    }

    // Get all published blogs
    const blogs = await Blog.find({ status: 'published' })
      .select('slug updatedAt')
      .sort('-publishedAt');

    // Generate sitemap
    const sitemap = generateSitemap(blogs, baseUrl);
    
    // Cache the sitemap for 1 hour
    cache.set(cacheKey, sitemap, 3600);
    
    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get robots.txt
exports.getRobotsTxt = async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    
    const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/admin/

# Disallow private areas
Disallow: /dashboard/
Disallow: /profile/
Disallow: /my-bookings/

# Allow important pages
Allow: /blogs/
Allow: /treks/
Allow: /about/
Allow: /contact/

# Crawl delay (optional)
Crawl-delay: 1`;

    res.set('Content-Type', 'text/plain');
    res.send(robotsTxt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get RSS feed
exports.getRSSFeed = async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    
    // Check cache
    const cacheKey = 'rss_feed';
    const cachedFeed = cache.get(cacheKey);
    if (cachedFeed) {
      res.set('Content-Type', 'application/rss+xml');
      return res.send(cachedFeed);
    }

    // Get recent published blogs
    const blogs = await Blog.find({ status: 'published' })
      .populate('author', 'name')
      .sort('-publishedAt')
      .limit(20);

    const currentDate = new Date().toISOString();
    
    let rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Trek Adventures Blog</title>
    <link>${baseUrl}/blogs</link>
    <description>Discover amazing travel stories, trekking tips, and adventure guides from our expert team.</description>
    <language>en-US</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>Trek Adventures Blog</title>
      <link>${baseUrl}/blogs</link>
    </image>`;

    blogs.forEach(blog => {
      const pubDate = new Date(blog.publishedAt).toUTCString();
      const description = blog.excerpt.replace(/<[^>]*>/g, ''); // Remove HTML tags
      
      rssFeed += `
    <item>
      <title><![CDATA[${blog.title}]]></title>
      <link>${baseUrl}/blogs/${blog.slug}</link>
      <guid>${baseUrl}/blogs/${blog.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
      <author>${blog.author.name}</author>
      <category>Travel</category>
    </item>`;
    });

    rssFeed += `
  </channel>
</rss>`;

    // Cache the RSS feed for 30 minutes
    cache.set(cacheKey, rssFeed, 1800);
    
    res.set('Content-Type', 'application/rss+xml');
    res.send(rssFeed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
    const region = req.query.region || '';

    // Check cache
    const cacheKey = `blogs_${page}_${limit}_${search}_${sort}_${region}`;
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
    
    // Add region filter if provided
    if (region) {
      query.region = region;
    }

    const blogs = await Blog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('author', 'name')
      .populate('region', 'name slug image');

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
    }).populate('author', 'name')
      .populate('region', 'name slug image description');

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
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Admin can update any blog
    if (req.user.role !== 'admin' && blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // If this is a full update (not just status change), validate all required fields
    const isFullUpdate = Object.keys(req.body).length > 1 || !req.body.hasOwnProperty('status');
    if (isFullUpdate) {
      const errors = validateBlogData(req.body);
      if (errors.length > 0) {
        return res.status(400).json({ message: errors.join(', ') });
      }
    } else {
      // For status-only updates, validate only the status-specific requirements
      if (req.body.status === 'published') {
        if (!blog.bannerImage) {
          return res.status(400).json({ message: 'Banner image is required for published blogs' });
        }
        if (!blog.title?.trim()) {
          return res.status(400).json({ message: 'Title is required for published blogs' });
        }
        if (!blog.content?.trim()) {
          return res.status(400).json({ message: 'Content is required for published blogs' });
        }
        if (!blog.excerpt?.trim()) {
          return res.status(400).json({ message: 'Excerpt is required for published blogs' });
        }
        if (!blog.metaTitle?.trim()) {
          return res.status(400).json({ message: 'Meta title is required for published blogs' });
        }
        if (!blog.metaDescription?.trim()) {
          return res.status(400).json({ message: 'Meta description is required for published blogs' });
        }
        if (!blog.keywords?.length) {
          return res.status(400).json({ message: 'At least one keyword is required for published blogs' });
        }
      }
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

// Get blogs by region
exports.getBlogsByRegion = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-publishedAt';

    // Check cache
    const cacheKey = `blogs_region_${req.params.slug}_${page}_${limit}_${sort}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const query = { 
      status: 'published',
      region: req.params.regionId
    };

    const blogs = await Blog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('author', 'name')
      .populate('region', 'name slug image description');

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