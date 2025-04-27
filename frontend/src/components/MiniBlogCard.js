import React from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

function MiniBlogCard({ blog }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {blog.image && (
        <img 
          src={blog.image} 
          alt={blog.title} 
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{blog.title}</h3>
        
        <div className="flex items-center text-sm text-gray-500 mt-1">
          {blog.author && <span className="mr-2">{blog.author}</span>}
          <span>{format(new Date(blog.date), 'MMM d, yyyy')}</span>
        </div>
        
        <p className="mt-2 text-gray-600 line-clamp-3">{blog.content}</p>
        
        {blog.trekId && (
          <Link 
            to={`/weekend-getaways/${blog.trekId}`}
            className="mt-3 inline-block text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Read more about {blog.trekName}
          </Link>
        )}
      </div>
    </div>
  );
}

export default MiniBlogCard; 