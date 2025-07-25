const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [100, 'Content must be at least 100 characters long']
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    trim: true,
    minlength: [50, 'Excerpt must be at least 50 characters long'],
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  bannerImage: {
    type: String,
    required: function() {
      return this.status === 'published';
    },
    validate: {
      validator: function(v) {
        if (this.status === 'published') {
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        }
        return true;
      },
      message: 'Banner image must be a valid image URL for published blogs'
    }
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogRegion',
    required: [true, 'Region is required']
  },
  metaTitle: {
    type: String,
    required: [true, 'Meta title is required'],
    trim: true,
    minlength: [10, 'Meta title must be at least 10 characters long'],
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  metaDescription: {
    type: String,
    required: [true, 'Meta description is required'],
    trim: true,
    minlength: [50, 'Meta description must be at least 50 characters long'],
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  keywords: [{
    type: String,
    trim: true,
    minlength: [2, 'Keywords must be at least 2 characters long'],
    maxlength: [50, 'Keywords cannot exceed 50 characters']
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'published'],
      message: 'Status must be either draft or published'
    },
    default: 'draft'
  },
  publishedAt: {
    type: Date,
    validate: {
      validator: function(v) {
        return this.status === 'published' ? v != null : true;
      },
      message: 'Published date is required when status is published'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for better search performance
blogSchema.index({ title: 'text', content: 'text', keywords: 'text' });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ author: 1, createdAt: -1 });
blogSchema.index({ slug: 1 }, { unique: true });
blogSchema.index({ region: 1, status: 1, publishedAt: -1 });

// Create slug from title before saving
blogSchema.pre('save', async function(next) {
  // Always generate slug if title is provided
  if (this.title) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    // Handle uniqueness
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existingBlog = await this.constructor.findOne({ slug: slug, _id: { $ne: this._id } });
      if (!existingBlog) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Update updatedAt timestamp
  this.updatedAt = new Date();
  
  next();
});

// Add virtual for reading time
blogSchema.virtual('readingTime').get(function() {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
});

// Add method to check if blog is published
blogSchema.methods.isPublished = function() {
  return this.status === 'published' && this.publishedAt != null;
};

// Add method to get formatted date
blogSchema.methods.getFormattedDate = function() {
  return this.publishedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Add static method to find published blogs
blogSchema.statics.findPublished = function() {
  return this.find({ status: 'published' }).sort({ publishedAt: -1 });
};

// Add static method to find drafts
blogSchema.statics.findDrafts = function() {
  return this.find({ status: 'draft' }).sort({ updatedAt: -1 });
};

// Export both the schema and the model
const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog; 