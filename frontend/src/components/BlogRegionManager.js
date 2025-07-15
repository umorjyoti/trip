import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllBlogRegions, deleteBlogRegion } from '../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import AdminLayout from '../layouts/AdminLayout';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';

function BlogRegionManager() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const data = await getAllBlogRegions();
      setRegions(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching blog regions:', err);
      setError('Failed to load blog regions');
      toast.error('Failed to load blog regions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = (id) => {
    setDeleteConfirmation(id);
  };

  const handleDelete = async () => {
    if (!deleteConfirmation) return;
    
    try {
      setLoading(true);
      await deleteBlogRegion(deleteConfirmation);
      toast.success('Blog region deleted successfully');
      setDeleteConfirmation(null);
      fetchRegions();
    } catch (err) {
      console.error('Error deleting blog region:', err);
      toast.error('Failed to delete blog region');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Blog Regions
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage regions for categorizing blog content
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/admin/blog-regions/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <FaPlus className="-ml-1 mr-2 h-5 w-5" />
              Add Region
            </Link>
          </div>
        </div>

        <div className="mt-8 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {regions.length === 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
              <p className="text-gray-500 mb-4">No blog regions found.</p>
              <Link
                to="/admin/blog-regions/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                Create Your First Blog Region
              </Link>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {regions.map((region) => (
                  <li key={region._id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={region.image}
                              alt={region.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <h3 className="text-lg font-medium text-gray-900">
                                {region.name}
                              </h3>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                region.isEnabled 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {region.isEnabled ? (
                                  <>
                                    <FaEye className="mr-1" />
                                    Enabled
                                  </>
                                ) : (
                                  <>
                                    <FaEyeSlash className="mr-1" />
                                    Disabled
                                  </>
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {region.description}
                            </p>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <span>Slug: {region.slug}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/admin/blog-regions/edit/${region._id}`}
                            className="text-emerald-600 hover:text-emerald-900"
                          >
                            <FaEdit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteConfirm(region._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirmation}
          onClose={() => setDeleteConfirmation(null)}
          title="Delete Blog Region"
        >
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this blog region? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}

export default BlogRegionManager; 