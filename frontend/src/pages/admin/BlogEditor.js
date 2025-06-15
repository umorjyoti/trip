import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import RichTextEditor from '../../components/RichTextEditor';
import ReactMarkdown from 'react-markdown';
import { debounce } from 'lodash';

function BlogEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(id ? true : false);
  const [submitting, setSubmitting] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState({});
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
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'Excerpt is required';
    }
    if (!formData.metaTitle.trim()) {
      newErrors.metaTitle = 'Meta title is required';
    }
    if (!formData.metaDescription.trim()) {
      newErrors.metaDescription = 'Meta description is required';
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

      const response = await axios.post('/blogs/upload-image', formData, {
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

    if (formData.status === 'published' && !window.confirm('Are you sure you want to publish this blog?')) {
      return;
    }

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
            <h1>{formData.title}</h1>
            {formData.bannerImage && (
              <img
                src={formData.bannerImage}
                alt={formData.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
            <ReactMarkdown>{formData.content}</ReactMarkdown>
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
              <label className="block text-sm font-medium text-gray-700">Excerpt</label>
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
                required
              />
              {errors.excerpt && (
                <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>
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
              <div className="mt-1 flex items-center space-x-4">
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
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                )}
                {formData.bannerImage && (
                  <div className="relative w-20 h-20">
                    <img
                      src={formData.bannerImage}
                      alt="Banner preview"
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
              {errors.bannerImage && (
                <p className="mt-1 text-sm text-red-600">{errors.bannerImage}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Meta Title</label>
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
                required
              />
              {errors.metaTitle && (
                <p className="mt-1 text-sm text-red-600">{errors.metaTitle}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Meta Description</label>
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
                required
              />
              {errors.metaDescription && (
                <p className="mt-1 text-sm text-red-600">{errors.metaDescription}</p>
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
    </div>
  );
}

export default BlogEditor; 