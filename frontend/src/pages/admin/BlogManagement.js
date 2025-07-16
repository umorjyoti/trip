import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaGlobe, FaBlog, FaCalendarAlt, FaUser } from 'react-icons/fa';
import api from '../../services/api';
import { getAllBlogRegions, deleteBlogRegion } from '../../services/api';
import Modal from '../../components/Modal';

function BlogManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('blogs'); // 'blogs' or 'regions'
  const [blogs, setBlogs] = useState([]);
  const [blogRegions, setBlogRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('-createdAt');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [statusChangeConfirmation, setStatusChangeConfirmation] = useState(null);

  useEffect(() => {
    if (activeTab === 'blogs') {
      fetchBlogs();
    } else {
      fetchBlogRegions();
    }
  }, [activeTab, filter, sort]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/blogs/admin?status=${filter}&sort=${sort}`);
      setBlogs(response.data);
    } catch (error) {
      toast.error('Failed to fetch blogs');
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogRegions = async () => {
    try {
      setLoading(true);
      const response = await getAllBlogRegions();
      setBlogRegions(response);
    } catch (error) {
      toast.error('Failed to fetch blog regions');
      console.error('Error fetching blog regions:', error);
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

  const handleDeleteRegion = async () => {
    if (!deleteConfirmation) return;
    
    try {
      setLoading(true);
      await deleteBlogRegion(deleteConfirmation);
      toast.success('Blog region deleted successfully');
      setDeleteConfirmation(null);
      fetchBlogRegions();
    } catch (err) {
      console.error('Error deleting blog region:', err);
      toast.error('Failed to delete blog region');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setStatusChangeConfirmation({ id, newStatus });
  };

  const confirmStatusChange = async () => {
    if (!statusChangeConfirmation) return;
    
    const { id, newStatus } = statusChangeConfirmation;
    const action = newStatus === 'published' ? 'publish' : 'unpublish';
    
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
      setStatusChangeConfirmation(null);
    }
  };



  const filteredBlogs = blogs.filter(blog => {
    if (filter === 'all') return true;
    return blog.status === filter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
        {/* Header with Tabs */}
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog Management</h1>
              <p className="text-gray-600 text-lg">Manage your blog content and regions</p>
            </div>
            <div className="flex space-x-4">
              {activeTab === 'blogs' && (
                <button
                  onClick={() => navigate('/admin/blogs/new')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 transform hover:scale-105"
                >
                  <FaPlus className="mr-3 h-5 w-5" />
                  New Blog
                </button>
              )}
              {activeTab === 'regions' && (
                <button
                  onClick={() => navigate('/admin/blog-regions/new')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 transform hover:scale-105"
                >
                  <FaPlus className="mr-3 h-5 w-5" />
                  New Region
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('blogs')}
                className={`flex items-center px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'blogs'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FaBlog className="mr-3 h-4 w-4" />
                Blogs ({filteredBlogs.length})
              </button>
              <button
                onClick={() => setActiveTab('regions')}
                className={`flex items-center px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'regions'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FaGlobe className="mr-3 h-4 w-4" />
                Blog Regions ({blogRegions.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Blogs Tab Content */}
        {activeTab === 'blogs' && (
          <>
            {/* Filters and Sort */}
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200"
                    >
                      <option value="all">All Blogs</option>
                      <option value="published">Published</option>
                      <option value="draft">Drafts</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200"
                    >
                      <option value="-createdAt">Newest First</option>
                      <option value="createdAt">Oldest First</option>
                      <option value="-publishedAt">Recently Published</option>
                      <option value="title">Title A-Z</option>
                      <option value="-title">Title Z-A</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>



            {/* Blogs Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-lg">Loading blogs...</p>
                </div>
              ) : filteredBlogs.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <FaBlog className="mx-auto h-16 w-16" />
                  </div>
                  <p className="text-gray-600 text-lg mb-4">No blogs found</p>
                  <button
                    onClick={() => navigate('/admin/blogs/new')}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                  >
                    <FaPlus className="mr-3 h-5 w-5" />
                    Create Your First Blog
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
                  {filteredBlogs.map((blog) => (
                    <div key={blog._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                      {/* Banner Image */}
                      {blog.bannerImage && (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={blog.bannerImage}
                            alt={blog.title}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                      )}
                      
                      {/* Card Content */}
                      <div className="p-6">
                        {/* Status Badge */}
                        <div className="flex justify-between items-start mb-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            blog.status === 'published' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {blog.status === 'published' ? (
                              <>
                                <FaEye className="mr-1 h-3 w-3" />
                                Published
                              </>
                            ) : (
                              <>
                                <FaEyeSlash className="mr-1 h-3 w-3" />
                                Draft
                              </>
                            )}
                          </span>
                          {actionLoading[blog._id] && (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                          )}
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight">
                          {blog.title}
                        </h3>
                        
                        {/* Excerpt */}
                        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                          {blog.excerpt}
                        </p>
                        
                        {/* Dates */}
                        <div className="space-y-2 mb-6">
                          <div className="flex items-center text-sm text-gray-500">
                            <FaCalendarAlt className="mr-2 h-4 w-4" />
                            <span>Created: {format(new Date(blog.createdAt), 'MMM d, yyyy')}</span>
                          </div>
                          {blog.publishedAt && (
                            <div className="flex items-center text-sm text-gray-500">
                              <FaUser className="mr-2 h-4 w-4" />
                              <span>Published: {format(new Date(blog.publishedAt), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap justify-between items-center pt-4 border-t border-gray-100 gap-3">
                          <button
                            onClick={() => navigate(`/admin/blogs/${blog._id}`)}
                            className="flex items-center text-emerald-600 hover:text-emerald-900 text-sm font-medium transition-colors duration-200"
                            disabled={actionLoading[blog._id]}
                          >
                            <FaEdit className="mr-1 h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleStatusChange(blog._id, blog.status === 'published' ? 'draft' : 'published')}
                            className="flex items-center text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors duration-200"
                            disabled={actionLoading[blog._id]}
                          >
                            {blog.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleDelete(blog._id)}
                            className="flex items-center text-red-600 hover:text-red-900 text-sm font-medium transition-colors duration-200"
                            disabled={actionLoading[blog._id]}
                          >
                            <FaTrash className="mr-1 h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Regions Tab Content */}
        {activeTab === 'regions' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Loading blog regions...</p>
              </div>
            ) : blogRegions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <FaGlobe className="mx-auto h-16 w-16" />
                </div>
                <p className="text-gray-600 text-lg mb-4">No blog regions found.</p>
                <button
                  onClick={() => navigate('/admin/blog-regions/new')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                >
                  <FaPlus className="mr-3 h-5 w-5" />
                  Create Your First Blog Region
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {blogRegions.map((region) => (
                  <div key={region._id} className="p-8 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16 rounded-xl overflow-hidden shadow-md">
                          <img
                            className="h-full w-full object-cover"
                            src={region.image}
                            alt={region.name}
                          />
                        </div>
                        <div className="ml-6">
                          <div className="flex items-center mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              {region.name}
                            </h3>
                            <span className={`ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              region.isEnabled 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {region.isEnabled ? (
                                <>
                                  <FaEye className="mr-1 h-3 w-3" />
                                  Enabled
                                </>
                              ) : (
                                <>
                                  <FaEyeSlash className="mr-1 h-3 w-3" />
                                  Disabled
                                </>
                              )}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3 leading-relaxed">
                            {region.description}
                          </p>
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="bg-gray-100 px-3 py-1 rounded-full font-mono">
                              {region.slug}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => navigate(`/admin/blog-regions/edit/${region._id}`)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                        >
                          <FaEdit className="mr-2 h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirmation(region._id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                        >
                          <FaTrash className="mr-2 h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirmation}
          onClose={() => setDeleteConfirmation(null)}
          title="Delete Blog Region"
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <FaTrash className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Blog Region</h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this blog region? This will permanently remove the region and may affect blogs associated with it.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRegion}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
              >
                Delete Region
              </button>
            </div>
          </div>
        </Modal>

        {/* Status Change Confirmation Modal */}
        <Modal
          isOpen={!!statusChangeConfirmation}
          onClose={() => setStatusChangeConfirmation(null)}
          title={statusChangeConfirmation?.newStatus === 'published' ? 'Publish Blog' : 'Unpublish Blog'}
          size="small"
        >
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  statusChangeConfirmation?.newStatus === 'published' 
                    ? 'bg-green-100' 
                    : 'bg-yellow-100'
                }`}>
                  {statusChangeConfirmation?.newStatus === 'published' ? (
                    <FaEye className="w-5 h-5 text-green-600" />
                  ) : (
                    <FaEyeSlash className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">
                  {statusChangeConfirmation?.newStatus === 'published' 
                    ? 'This blog will be published and visible to all visitors immediately.'
                    : 'This blog will be unpublished and no longer visible to visitors.'
                  }
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setStatusChangeConfirmation(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors ${
                  statusChangeConfirmation?.newStatus === 'published'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {statusChangeConfirmation?.newStatus === 'published' ? 'Publish' : 'Unpublish'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default BlogManagement; 