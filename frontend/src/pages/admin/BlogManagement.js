import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import SEOAnalytics from '../../components/SEOAnalytics';

function BlogManagement() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('-createdAt');
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, [filter, sort]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/blogs/admin?status=${filter}&sort=${sort}`);
      setBlogs(response.data);
    } catch (error) {
      toast.error('Failed to fetch blogs');
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      try {
        setActionLoading(prev => ({ ...prev, [id]: true }));
        await axios.delete(`/blogs/${id}`);
        toast.success('Blog deleted successfully');
        fetchBlogs();
      } catch (error) {
        toast.error('Failed to delete blog');
        console.error('Error deleting blog:', error);
      } finally {
        setActionLoading(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const action = newStatus === 'published' ? 'publish' : 'unpublish';
    const confirmMessage = newStatus === 'published'
      ? 'Are you sure you want to publish this blog?'
      : 'Are you sure you want to unpublish this blog? It will no longer be visible to users.';

    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      await axios.put(`/blogs/${id}`, { status: newStatus });
      toast.success(`Blog ${action}ed successfully`);
      fetchBlogs();
    } catch (error) {
      toast.error(`Failed to ${action} blog`);
      console.error(`Error ${action}ing blog:`, error);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleViewAnalytics = (blog) => {
    setSelectedBlog(blog);
    setShowAnalytics(true);
  };

  const filteredBlogs = blogs.filter(blog => {
    if (filter === 'all') return true;
    return blog.status === filter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
        <button
          onClick={() => navigate('/admin/blogs/new')}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700"
        >
          New Blog
        </button>
      </div>

      {/* Filters and Sort */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Blogs</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
        <div className="flex-1">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="-createdAt">Newest First</option>
            <option value="createdAt">Oldest First</option>
            <option value="-publishedAt">Recently Published</option>
            <option value="title">Title A-Z</option>
            <option value="-title">Title Z-A</option>
          </select>
        </div>
      </div>

      {/* Analytics Modal */}
      {showAnalytics && selectedBlog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  SEO Analytics - {selectedBlog.title}
                </h2>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <SEOAnalytics blogId={selectedBlog._id} />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading blogs...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No blogs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredBlogs.map((blog) => (
              <div key={blog._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                {/* Banner Image */}
                {blog.bannerImage && (
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={blog.bannerImage}
                      alt={blog.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  </div>
                )}
                
                {/* Card Content */}
                <div className="p-4">
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      blog.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {blog.status}
                    </span>
                    {actionLoading[blog._id] && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                    )}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {blog.title}
                  </h3>
                  
                  {/* Excerpt */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {blog.excerpt}
                  </p>
                  
                  {/* Dates */}
                  <div className="text-xs text-gray-500 mb-4 space-y-1">
                    <div>Created: {format(new Date(blog.createdAt), 'MMM d, yyyy')}</div>
                    {blog.publishedAt && (
                      <div>Published: {format(new Date(blog.publishedAt), 'MMM d, yyyy')}</div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-between items-center pt-4 border-t border-gray-100 gap-2">
                    <button
                      onClick={() => navigate(`/admin/blogs/${blog._id}`)}
                      className="text-emerald-600 hover:text-emerald-900 text-sm font-medium"
                      disabled={actionLoading[blog._id]}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleStatusChange(blog._id, blog.status === 'published' ? 'draft' : 'published')}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      disabled={actionLoading[blog._id]}
                    >
                      {blog.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDelete(blog._id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                      disabled={actionLoading[blog._id]}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogManagement; 