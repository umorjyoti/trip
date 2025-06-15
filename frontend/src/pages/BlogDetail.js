import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
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
          <article className="prose prose-lg prose-emerald max-w-none">
            <ReactMarkdown
              components={{
                img: ({ node, ...props }) => (
                  <div className="relative">
                    <img
                      {...props}
                      className="w-full h-auto rounded-lg"
                      loading="lazy"
                    />
                  </div>
                ),
                code: ({ node, inline, className, children, ...props }) => (
                  <code
                    className={`${className} bg-gray-100 rounded px-1 py-0.5`}
                    {...props}
                  >
                    {children}
                  </code>
                ),
                pre: ({ node, children, ...props }) => (
                  <pre
                    className="bg-gray-100 rounded-lg p-4 overflow-x-auto"
                    {...props}
                  >
                    {children}
                  </pre>
                ),
              }}
            >
              {blog.content}
            </ReactMarkdown>
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