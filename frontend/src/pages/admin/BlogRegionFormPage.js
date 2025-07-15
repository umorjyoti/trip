import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBlogRegionById } from '../../services/api';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaGlobe, FaExclamationTriangle } from 'react-icons/fa';
import BlogRegionForm from '../../components/BlogRegionForm';
import LoadingSpinner from '../../components/LoadingSpinner';

function BlogRegionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [region, setRegion] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchRegion = async () => {
        try {
          setLoading(true);
          const data = await getBlogRegionById(id);
          setRegion(data);
          setError(null);
        } catch (err) {
          console.error('Error fetching blog region:', err);
          setError('Failed to load blog region');
          toast.error('Failed to load blog region');
        } finally {
          setLoading(false);
        }
      };

      fetchRegion();
    }
  }, [id]);

  const handleSave = async (formData) => {
    try {
      setLoading(true);
      navigate('/admin/blogs');
    } catch (err) {
      console.error('Error saving blog region:', err);
      toast.error(err.response?.data?.message || 'Failed to save blog region');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
          {/* Header */}
          <div className="mb-8">
          

            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
              <button
                onClick={() => navigate('/admin/blogs')}
                className="hover:text-emerald-600 transition-colors duration-200"
              >
                Blog Management
              </button>
              <span>/</span>
              <span className="text-gray-900 font-medium">
                {id ? 'Edit Region' : 'New Region'}
              </span>
            </nav>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-red-800 mb-2">
                    Error Loading Blog Region
                  </h3>
                  <p className="text-red-700">{error}</p>
                  <div className="mt-4">
                    <button
                      onClick={() => navigate('/admin/blogs')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                    >
                      <FaArrowLeft className="mr-2 h-4 w-4" />
                      Back to Blog Management
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8">
              <BlogRegionForm 
                region={region} 
                onSave={handleSave} 
                isEditing={!!id} 
              />
            </div>
          </div>

       
        </div>
      </div>
  );
}

export default BlogRegionFormPage; 