import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

function RelatedBlogs({ blogs, regionName, regionSlug }) {
  if (!blogs || blogs.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            More Stories from {regionName}
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Discover other amazing adventures and stories from this region
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <Link
              key={blog._id}
              to={`/blogs/${blog.slug}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
            >
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={blog.bannerImage}
                  alt={blog.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                {blog.region && (
                  <div className="flex items-center mb-2">
                    <img
                      src={blog.region.image}
                      alt={blog.region.name}
                      className="w-4 h-4 rounded-full mr-2"
                    />
                    <span className="text-sm text-emerald-600 font-medium">
                      {blog.region.name}
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                  {blog.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {blog.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>By {blog.author?.name || 'Unknown'}</span>
                  <span>
                    {blog.publishedAt && !isNaN(new Date(blog.publishedAt))
                      ? format(new Date(blog.publishedAt), 'MMM dd, yyyy')
                      : ''}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to={`/blogs/region/${regionSlug}`}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
          >
            Explore All Stories from {regionName}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RelatedBlogs; 