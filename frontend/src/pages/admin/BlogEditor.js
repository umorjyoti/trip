import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import RichTextEditor from '../../components/RichTextEditor';
import { debounce } from 'lodash';
import api from '../../services/api';

function BlogEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(id ? true : false);
  const [submitting, setSubmitting] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    bannerImage: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    status: 'draft'
  });

  useEffect(() => {
    if (id) {
      fetchBlog();
    }
  }, [id]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showConfirmModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showConfirmModal]);

  // Auto-save draft every 30 seconds
  const autoSave = useCallback(
    debounce(async (data) => {
      if (id && data.status === 'draft') {
        try {
          await axios.put(`/blogs/${id}`, {
            ...data,
            keywords: data.keywords.split(',').map(k => k.trim()).filter(k => k)
          });
          toast.info('Draft auto-saved');
        } catch (error) {
          console.error('Error auto-saving draft:', error);
        }
      }
    }, 30000),
    [id]
  );

  useEffect(() => {
    if (id && formData.status === 'draft') {
      autoSave(formData);
    }
    return () => autoSave.cancel();
  }, [formData, id, autoSave]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/blogs/admin/${id}`);
      const blog = response.data;
      setFormData({
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        bannerImage: blog.bannerImage,
        metaTitle: blog.metaTitle,
        metaDescription: blog.metaDescription,
        keywords: blog.keywords.join(', '),
        status: blog.status
      });
    } catch (error) {
      toast.error('Failed to fetch blog');
      console.error('Error fetching blog:', error);
      navigate('/admin/blogs');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.trim().length < 100) {
      newErrors.content = 'Content must be at least 100 characters long';
    }
    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'Excerpt is required';
    } else if (formData.excerpt.trim().length < 50) {
      newErrors.excerpt = 'Excerpt must be at least 50 characters long';
    }
    if (!formData.metaTitle.trim()) {
      newErrors.metaTitle = 'Meta title is required';
    } else if (formData.metaTitle.trim().length < 10) {
      newErrors.metaTitle = 'Meta title must be at least 10 characters long';
    }
    if (!formData.metaDescription.trim()) {
      newErrors.metaDescription = 'Meta description is required';
    } else if (formData.metaDescription.trim().length < 50) {
      newErrors.metaDescription = 'Meta description must be at least 50 characters long';
    }
    if (!formData.keywords.trim()) {
      newErrors.keywords = 'At least one keyword is required';
    }
    if (formData.status === 'published' && !formData.bannerImage) {
      newErrors.bannerImage = 'Banner image is required for published blogs';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (file) => {
    try {
      setUploadingImage(true);
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
        return '';
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('File size too large. Maximum size is 5MB.');
        return '';
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/blogs/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.url;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to upload image';
      toast.error(errorMessage);
      console.error('Error uploading image:', error);
      return '';
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBannerImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('File size too large. Maximum size is 5MB.');
        return;
      }

      setBannerImageFile(file);
      // Create a preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, bannerImage: previewUrl }));
      setErrors(prev => ({ ...prev, bannerImage: '' }));

      // Cleanup function to revoke the object URL when component unmounts or when image changes
      return () => {
        URL.revokeObjectURL(previewUrl);
      };
    }
  };

  // Add cleanup for image preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (bannerImageFile) {
        URL.revokeObjectURL(formData.bannerImage);
      }
    };
  }, [bannerImageFile, formData.bannerImage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    // Show confirmation modal instead of browser confirm
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);

    try {
      setSubmitting(true);
      let bannerImageUrl = formData.bannerImage;

      // If there's a new banner image file, upload it first
      if (bannerImageFile) {
        bannerImageUrl = await handleImageUpload(bannerImageFile);
        if (!bannerImageUrl) {
          toast.error('Failed to upload banner image');
          return;
        }
      }

      const blogData = {
        ...formData,
        bannerImage: bannerImageUrl,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
      };

      if (id) {
        await axios.put(`/blogs/${id}`, blogData);
        toast.success('Blog updated successfully');
      } else {
        await axios.post('/blogs', blogData);
        toast.success('Blog created successfully');
      }
      navigate('/admin/blogs');
    } catch (error) {
      const errorMessage = error.response?.data?.message || (id ? 'Failed to update blog' : 'Failed to create blog');
      toast.error(errorMessage);
      console.error('Error saving blog:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          <p className="text-gray-600">Loading blog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? 'Edit Blog' : 'Create New Blog'}
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/admin/blogs')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="text-emerald-600 hover:text-emerald-900"
              disabled={submitting}
            >
              {isPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
        </div>

        {isPreview ? (
          <div className="prose prose-lg max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{formData.title}</h1>
            {formData.bannerImage && (
              <img
                src={formData.bannerImage}
                alt={formData.title}
                className="w-full max-w-2xl h-96 object-cover rounded-lg mb-8 mx-auto"
              />
            )}
            <div 
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: formData.content }}
            />
            <style>{`
              .blog-content {
                line-height: 1.8;
                color: #374151;
              }
              .blog-content h1 {
                font-size: 2.25rem;
                font-weight: 700;
                margin: 2rem 0 1rem 0;
                color: #111827;
              }
              .blog-content h2 {
                font-size: 1.875rem;
                font-weight: 600;
                margin: 1.75rem 0 1rem 0;
                color: #1f2937;
              }
              .blog-content h3 {
                font-size: 1.5rem;
                font-weight: 600;
                margin: 1.5rem 0 0.75rem 0;
                color: #374151;
              }
              .blog-content h4 {
                font-size: 1.25rem;
                font-weight: 600;
                margin: 1.25rem 0 0.5rem 0;
                color: #4b5563;
              }
              .blog-content p {
                margin: 1rem 0;
                text-align: justify;
              }
              .blog-content img {
                max-width: 600px;
                height: 400px;
                object-fit: cover;
                border-radius: 8px;
                margin: 1.5rem auto;
                display: block;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .blog-content ul, .blog-content ol {
                margin: 1rem 0;
                padding-left: 2rem;
              }
              .blog-content li {
                margin: 0.5rem 0;
              }
              .blog-content blockquote {
                border-left: 4px solid #10b981;
                padding-left: 1rem;
                margin: 1.5rem 0;
                font-style: italic;
                color: #6b7280;
                background-color: #f9fafb;
                padding: 1rem;
                border-radius: 4px;
              }
              .blog-content code {
                background-color: #f3f4f6;
                padding: 0.125rem 0.25rem;
                border-radius: 3px;
                font-size: 0.875rem;
                color: #e11d48;
              }
              .blog-content pre {
                background-color: #1f2937;
                color: #f9fafb;
                padding: 1rem;
                border-radius: 6px;
                overflow-x: auto;
                margin: 1.5rem 0;
              }
              .blog-content pre code {
                background-color: transparent;
                color: inherit;
                padding: 0;
              }
              .blog-content a {
                color: #10b981;
                text-decoration: underline;
              }
              .blog-content a:hover {
                color: #059669;
              }
              .blog-content strong {
                font-weight: 600;
                color: #111827;
              }
              .blog-content em {
                font-style: italic;
                color: #6b7280;
              }
            `}</style>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  setErrors(prev => ({ ...prev, title: '' }));
                }}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Excerpt 
                <span className="text-gray-500 text-xs ml-1">
                  ({formData.excerpt.length}/500 characters, min 50)
                </span>
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => {
                  setFormData({ ...formData, excerpt: e.target.value });
                  setErrors(prev => ({ ...prev, excerpt: '' }));
                }}
                rows={3}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                  errors.excerpt ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Write a brief summary of your blog post (minimum 50 characters)"
                required
              />
              {errors.excerpt && (
                <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>
              )}
              {formData.excerpt.length > 0 && formData.excerpt.length < 50 && (
                <p className="mt-1 text-sm text-yellow-600">
                  {50 - formData.excerpt.length} more characters needed
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Content</label>
              <div className={`mt-1 ${errors.content ? 'border-2 border-red-300 rounded-md' : ''}`}>
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => {
                    setFormData({ ...formData, content });
                    setErrors(prev => ({ ...prev, content: '' }));
                  }}
                  onImageUpload={handleImageUpload}
                />
              </div>
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Banner Image</label>
              <div className="mt-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerImageChange}
                  className={`block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-emerald-50 file:text-emerald-700
                    hover:file:bg-emerald-100
                    ${errors.bannerImage ? 'border-2 border-red-300 rounded-md' : ''}`}
                />
                {uploadingImage && (
                  <div className="mt-2 flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600 mr-2"></div>
                    <span className="text-sm text-gray-600">Uploading image...</span>
                  </div>
                )}
                {formData.bannerImage && (
                  <div className="mt-3">
                    <div className="relative inline-block">
                      <img
                        src={formData.bannerImage}
                        alt="Banner preview"
                        className="w-32 h-24 object-cover rounded-md border border-gray-200 shadow-sm"
                      />
                      <div className="absolute top-1 right-1">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                          Preview
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Banner image preview (will be resized for display)</p>
                  </div>
                )}
              </div>
              {errors.bannerImage && (
                <p className="mt-1 text-sm text-red-600">{errors.bannerImage}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Meta Title
                <span className="text-gray-500 text-xs ml-1">
                  ({formData.metaTitle.length}/60 characters, min 10)
                </span>
              </label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => {
                  setFormData({ ...formData, metaTitle: e.target.value });
                  setErrors(prev => ({ ...prev, metaTitle: '' }));
                }}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                  errors.metaTitle ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="SEO title for search engines (minimum 10 characters)"
                required
              />
              {errors.metaTitle && (
                <p className="mt-1 text-sm text-red-600">{errors.metaTitle}</p>
              )}
              {formData.metaTitle.length > 0 && formData.metaTitle.length < 10 && (
                <p className="mt-1 text-sm text-yellow-600">
                  {10 - formData.metaTitle.length} more characters needed
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Meta Description
                <span className="text-gray-500 text-xs ml-1">
                  ({formData.metaDescription.length}/160 characters, min 50)
                </span>
              </label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => {
                  setFormData({ ...formData, metaDescription: e.target.value });
                  setErrors(prev => ({ ...prev, metaDescription: '' }));
                }}
                rows={3}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                  errors.metaDescription ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="SEO description for search engines (minimum 50 characters)"
                required
              />
              {errors.metaDescription && (
                <p className="mt-1 text-sm text-red-600">{errors.metaDescription}</p>
              )}
              {formData.metaDescription.length > 0 && formData.metaDescription.length < 50 && (
                <p className="mt-1 text-sm text-yellow-600">
                  {50 - formData.metaDescription.length} more characters needed
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Keywords (comma-separated)</label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => {
                  setFormData({ ...formData, keywords: e.target.value });
                  setErrors(prev => ({ ...prev, keywords: '' }));
                }}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                  errors.keywords ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.keywords && (
                <p className="mt-1 text-sm text-red-600">{errors.keywords}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                disabled={submitting}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {id ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  id ? 'Update Blog' : 'Create Blog'
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{backgroundColor: 'rgba(0, 0, 0, 0.75)'}}>
          <div className="mt-[550px] bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {id ? 'Update Blog Post' : 'Create Blog Post'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formData.status === 'published' ? 'This will be published immediately' : 'This will be saved as a draft'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Title</p>
                    <p className="text-sm text-gray-600 truncate">{formData.title}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      formData.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {formData.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                {formData.status === 'published' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">
                          This blog post will be published and visible to all visitors immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {id ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    {id ? 'Update Blog' : 'Create Blog'}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlogEditor; 