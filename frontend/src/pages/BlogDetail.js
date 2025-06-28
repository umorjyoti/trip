import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';

function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    fetchBlog();
  }, [slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/blogs/${slug}`);
      setBlog(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch blog. Please try again later.');
      console.error('Error fetching blog:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-gray-600">Blog not found</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{blog.metaTitle || blog.title}</title>
        <meta name="description" content={blog.metaDescription || blog.excerpt} />
        <meta name="keywords" content={blog.keywords.join(', ')} />
        <meta property="og:title" content={blog.metaTitle || blog.title} />
        <meta property="og:description" content={blog.metaDescription || blog.excerpt} />
        <meta property="og:image" content={blog.bannerImage} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.metaTitle || blog.title} />
        <meta name="twitter:description" content={blog.metaDescription || blog.excerpt} />
        <meta name="twitter:image" content={blog.bannerImage} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Banner Section */}
        <div className="relative h-96">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          )}
          <img
            src={blog.bannerImage}
            alt={blog.title}
            className="w-full h-full object-cover"
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white max-w-4xl px-4">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{blog.title}</h1>
              <div className="flex items-center justify-center space-x-4 text-lg">
                <span>{blog.author.name}</span>
                <span>•</span>
                <span>{format(new Date(blog.publishedAt), 'MMMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <style>
            {`
              .blog-content img {
                width: 100%;
                max-width: 600px;
                height: 400px;
                object-fit: cover;
                border-radius: 8px;
                margin: 20px auto;
                display: block;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
              .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6 {
                color: #1f2937;
                font-weight: 600;
                margin-top: 2rem;
                margin-bottom: 1rem;
              }
              .blog-content h1 { font-size: 2.25rem; }
              .blog-content h2 { font-size: 1.875rem; }
              .blog-content h3 { font-size: 1.5rem; }
              .blog-content p {
                margin-bottom: 1.5rem;
                line-height: 1.75;
              }
              .blog-content ul, .blog-content ol {
                margin: 1.5rem 0;
                padding-left: 2rem;
              }
              .blog-content li {
                margin-bottom: 0.5rem;
              }
              .blog-content blockquote {
                border-left: 4px solid #10b981;
                padding-left: 1rem;
                margin: 1.5rem 0;
                font-style: italic;
                background-color: #f0fdf4;
                padding: 1rem;
                border-radius: 4px;
              }
              .blog-content code {
                background-color: #f3f4f6;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
              }
              .blog-content pre {
                background-color: #1f2937;
                color: #f9fafb;
                padding: 1rem;
                border-radius: 8px;
                overflow-x: auto;
                margin: 1.5rem 0;
              }
              .blog-content pre code {
                background-color: transparent;
                padding: 0;
                color: inherit;
              }
              .blog-content a {
                color: #10b981;
                text-decoration: underline;
              }
              .blog-content a:hover {
                color: #047857;
              }
            `}
          </style>
          <article className="prose prose-lg prose-emerald max-w-none">
            <div 
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: blog.content }}
              style={{
                lineHeight: '1.8',
                fontSize: '1.1rem',
                color: '#374151'
              }}
            />
          </article>

          {/* Meta Information */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {blog.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BlogDetail; 