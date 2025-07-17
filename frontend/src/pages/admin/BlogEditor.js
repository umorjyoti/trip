import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import RichTextEditor from '../../components/RichTextEditor';
import { debounce } from 'lodash';
import api from '../../services/api';
import { getBlogRegions } from '../../services/api';
import Modal from '../../components/Modal';

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
  const [blogRegions, setBlogRegions] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    bannerImage: '',
    region: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    status: 'draft'
  });

  // SEO Analysis state
  const [seoAnalysis, setSeoAnalysis] = useState({
    titleLength: 0,
    descriptionLength: 0,
    keywordDensity: {},
    readabilityScore: 0,
    imageAltTags: 0,
    internalLinks: 0
  });

  useEffect(() => {
    if (id) {
      fetchBlog();
    }
    fetchBlogRegions();
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
          await api.put(`/blogs/${id}`, {
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

  const fetchBlogRegions = async () => {
    try {
      const regions = await getBlogRegions();
      setBlogRegions(regions);
    } catch (error) {
      console.error('Error fetching blog regions:', error);
      toast.error('Failed to fetch blog regions');
    }
  };

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const blog = await api.get(`/blogs/admin/${id}`);
      setFormData({
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        bannerImage: blog.bannerImage,
        region: blog.region || '',
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
    if (!formData.region) {
      newErrors.region = 'Please select a region';
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

  const handleImageUpload = useCallback(async (file) => {
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
  }, []);

  const handleContentChange = useCallback((content) => {
    setFormData(prev => ({ ...prev, content }));
    setErrors(prev => ({ ...prev, content: '' }));
  }, []);

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
        await api.put(`/blogs/${id}`, blogData);
        toast.success('Blog updated successfully');
      } else {
        await api.post('/blogs', blogData);
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

  // Analyze SEO metrics
  const analyzeSEO = useCallback(() => {
    const analysis = {
      titleLength: formData.metaTitle.length,
      descriptionLength: formData.metaDescription.length,
      keywordDensity: {},
      readabilityScore: 0,
      imageAltTags: 0,
      internalLinks: 0
    };

    // Analyze keyword density
    const contentWords = formData.content.toLowerCase().split(/\s+/);
    const keywords = formData.keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
    
    keywords.forEach(keyword => {
      const keywordWords = keyword.split(/\s+/);
      let count = 0;
      for (let i = 0; i <= contentWords.length - keywordWords.length; i++) {
        let match = true;
        for (let j = 0; j < keywordWords.length; j++) {
          if (contentWords[i + j] !== keywordWords[j]) {
            match = false;
            break;
          }
        }
        if (match) count++;
      }
      analysis.keywordDensity[keyword] = {
        count,
        density: contentWords.length > 0 ? (count / contentWords.length * 100).toFixed(2) : 0
      };
    });

    // Count images without alt tags
    const imgTags = (formData.content.match(/<img[^>]*>/g) || []).length;
    const imgWithAlt = (formData.content.match(/<img[^>]*alt=["'][^"']*["'][^>]*>/g) || []).length;
    analysis.imageAltTags = imgTags - imgWithAlt;

    // Count internal links
    const internalLinks = (formData.content.match(/href=["']\/(?!\/)[^"']*["']/g) || []).length;
    analysis.internalLinks = internalLinks;

    // Calculate readability score (simple Flesch-Kincaid approximation)
    const sentences = formData.content.split(/[.!?]+/).length;
    const words = contentWords.length;
    const syllables = contentWords.reduce((acc, word) => {
      return acc + Math.max(1, word.replace(/[^aeiou]/gi, '').length);
    }, 0);
    
    if (sentences > 0 && words > 0) {
      analysis.readabilityScore = Math.round(206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words));
    }

    setSeoAnalysis(analysis);
  }, [formData]);

  useEffect(() => {
    analyzeSEO();
  }, [formData, analyzeSEO]);

  // SEO Preview Component
  // const SEOPreview = () => (
  //   <div className="bg-white p-6 rounded-lg shadow-sm border">
  //     <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Preview</h3>
  //     
  //     {/* Google Search Preview */}
  //     <div className="mb-6">
  //       <h4 className="text-sm font-medium text-gray-700 mb-2">Google Search Preview</h4>
  //       <div className="border rounded-lg p-3 bg-gray-50">
  //         <div className="text-blue-600 text-sm truncate">
  //           {window.location.origin}/blogs/{formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}
  //         </div>
  //         <div className="text-xl text-blue-600 font-medium truncate">
  //           {formData.metaTitle || formData.title}
  //         </div>
  //         <div className="text-sm text-gray-600 line-clamp-2">
  //           {formData.metaDescription || formData.excerpt}
  //         </div>
  //       </div>
  //     </div>
  //
  //     {/* SEO Analysis */}
  //     <div className="space-y-3">
  //       <h4 className="text-sm font-medium text-gray-700">SEO Analysis</h4>
  //       
  //       {/* Title Length */}
  //       <div className="flex justify-between items-center">
  //         <span className="text-sm text-gray-600">Title Length</span>
  //         <span className={`text-sm font-medium ${
  //           seoAnalysis.titleLength >= 10 && seoAnalysis.titleLength <= 60 
  //             ? 'text-green-600' 
  //             : 'text-red-600'
  //         }`}>
  //           {seoAnalysis.titleLength}/60
  //         </span>
  //       </div>
  //
  //       {/* Description Length */}
  //       <div className="flex justify-between items-center">
  //         <span className="text-sm text-gray-600">Description Length</span>
  //         <span className={`text-sm font-medium ${
  //           seoAnalysis.descriptionLength >= 50 && seoAnalysis.descriptionLength <= 160 
  //             ? 'text-green-600' 
  //             : 'text-red-600'
  //         }`}>
  //           {seoAnalysis.descriptionLength}/160
  //         </span>
  //       </div>
  //
  //       {/* Readability Score */}
  //       <div className="flex justify-between items-center">
  //         <span className="text-sm text-gray-600">Readability Score</span>
  //         <span className={`text-sm font-medium ${
  //           seoAnalysis.readabilityScore >= 60 
  //             ? 'text-green-600' 
  //             : seoAnalysis.readabilityScore >= 30 
  //               ? 'text-yellow-600' 
  //               : 'text-red-600'
  //         }`}>
  //           {seoAnalysis.readabilityScore}/100
  //         </span>
  //       </div>
  //
  //       {/* Missing Alt Tags */}
  //       {seoAnalysis.imageAltTags > 0 && (
  //         <div className="flex justify-between items-center">
  //           <span className="text-sm text-gray-600">Missing Alt Tags</span>
  //           <span className="text-sm font-medium text-red-600">
  //             {seoAnalysis.imageAltTags} images
  //           </span>
  //         </div>
  //       )}
  //
  //       {/* Internal Links */}
  //       <div className="flex justify-between items-center">
  //         <span className="text-sm text-gray-600">Internal Links</span>
  //         <span className={`text-sm font-medium ${
  //           seoAnalysis.internalLinks >= 2 
  //             ? 'text-green-600' 
  //             : 'text-yellow-600'
  //         }`}>
  //           {seoAnalysis.internalLinks} links
  //         </span>
  //       </div>
  //
  //       {/* Keyword Density */}
  //       {Object.keys(seoAnalysis.keywordDensity).length > 0 && (
  //         <div className="mt-4">
  //           <h5 className="text-sm font-medium text-gray-700 mb-2">Keyword Density</h5>
  //           {Object.entries(seoAnalysis.keywordDensity).map(([keyword, data]) => (
  //             <div key={keyword} className="flex justify-between items-center text-sm">
  //               <span className="text-gray-600">{keyword}</span>
  //               <span className={`font-medium ${
  //                 data.density >= 0.5 && data.density <= 2.5 
  //                   ? 'text-green-600' 
  //                   : 'text-red-600'
  //               }`}>
  //                 {data.density}% ({data.count} times)
  //               </span>
  //             </div>
  //           ))}
  //         </div>
  //       )}
  //     </div>
  //   </div>
  // );

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          <p className="text-gray-600">Loading blog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-2">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-3 md:mb-0">Edit Blog</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 font-medium transition text-base"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setIsPreview(!isPreview)}
              className="px-4 py-2 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition text-base"
            >
              {isPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
        </div>

        {isPreview ? (
          <div className="prose prose-base max-w-none">
            <h1 className="text-xl font-bold text-gray-900 mb-4">{formData.title}</h1>
            {formData.bannerImage && (
              <img
                src={formData.bannerImage}
                alt={formData.title}
                className="w-full max-w-2xl h-80 object-cover rounded-lg mb-6 mx-auto"
              />
            )}
            <div 
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: formData.content }}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, title: e.target.value }));
                  setErrors(prev => ({ ...prev, title: '' }));
                }}
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base bg-gray-50 ${errors.title ? 'border-red-300' : 'border-gray-300'}`}
                required
                placeholder="Enter blog title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">
                Excerpt <span className="text-gray-500 text-xs ml-1">({formData.excerpt.length}/500 characters, min 50)</span>
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, excerpt: e.target.value }));
                  setErrors(prev => ({ ...prev, excerpt: '' }));
                }}
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base bg-gray-50 resize-none ${errors.excerpt ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Write a brief summary of your blog post (minimum 50 characters)"
                required
              />
              {errors.excerpt && (
                <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>
              )}
              {formData.excerpt.length > 0 && formData.excerpt.length < 50 && (
                <p className="mt-1 text-xs text-yellow-600">
                  {50 - formData.excerpt.length} more characters needed
                </p>
              )}
            </div>

            {/* Region */}
            <div>
              <label className="block text-base font-medium text-gray-800 mb-2">
                Region <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.region}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, region: e.target.value }));
                    setErrors(prev => ({ ...prev, region: '' }));
                  }}
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base transition-all duration-200 ${
                    errors.region 
                      ? 'border-red-300 bg-red-50' 
                      : formData.region 
                        ? 'border-emerald-300 bg-emerald-50' 
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  }`}
                  required
                >
                  <option value="">Select a region for your blog</option>
                  {blogRegions.map((region) => (
                    <option key={region._id} value={region._id}>
                      {region.name}
                    </option>
                  ))}
                </select>
                {formData.region && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  </div>
                )}
              </div>
              {errors.region && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.region}
                </div>
              )}
              {blogRegions.length === 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-yellow-800">
                      No blog regions available. Please create blog regions first in the Blog Management page.
                    </span>
                  </div>
                </div>
              )}
              {blogRegions.length > 0 && !formData.region && (
                <p className="mt-2 text-sm text-gray-600">
                  Choose a region to categorize your blog content for better organization.
                </p>
              )}
            </div>

            {/* Content */}
            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">Content</label>
              <div className={`rounded-lg border bg-gray-50 ${errors.content ? 'border-red-300' : 'border-gray-300'}`}> 
                <RichTextEditor
                  key="blog-content-editor"
                  value={formData.content}
                  onChange={handleContentChange}
                  onImageUpload={handleImageUpload}
                />
              </div>
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>

            {/* Banner Image */}
            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">Banner Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerImageChange}
                className={`block w-full text-base text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-base file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 ${errors.bannerImage ? 'border-2 border-red-300 rounded-md' : ''}`}
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
                      className="w-40 h-28 object-cover rounded-lg border border-gray-200 shadow-sm"
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
              {errors.bannerImage && (
                <p className="mt-1 text-sm text-red-600">{errors.bannerImage}</p>
              )}
            </div>

            {/* Meta Title */}
            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">
                Meta Title <span className="text-gray-500 text-xs ml-1">({formData.metaTitle.length}/60 characters, min 10)</span>
              </label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, metaTitle: e.target.value }));
                  setErrors(prev => ({ ...prev, metaTitle: '' }));
                }}
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base bg-gray-50 ${errors.metaTitle ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="SEO title for search engines (minimum 10 characters)"
                required
              />
              {errors.metaTitle && (
                <p className="mt-1 text-sm text-red-600">{errors.metaTitle}</p>
              )}
              {formData.metaTitle.length > 0 && formData.metaTitle.length < 10 && (
                <p className="mt-1 text-xs text-yellow-600">
                  {10 - formData.metaTitle.length} more characters needed
                </p>
              )}
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">
                Meta Description <span className="text-gray-500 text-xs ml-1">({formData.metaDescription.length}/160 characters, min 50)</span>
              </label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, metaDescription: e.target.value }));
                  setErrors(prev => ({ ...prev, metaDescription: '' }));
                }}
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base bg-gray-50 resize-none ${errors.metaDescription ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="SEO description for search engines (minimum 50 characters)"
                required
              />
              {errors.metaDescription && (
                <p className="mt-1 text-sm text-red-600">{errors.metaDescription}</p>
              )}
              {formData.metaDescription.length > 0 && formData.metaDescription.length < 50 && (
                <p className="mt-1 text-xs text-yellow-600">
                  {50 - formData.metaDescription.length} more characters needed
                </p>
              )}
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">Keywords (comma-separated)</label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, keywords: e.target.value }));
                  setErrors(prev => ({ ...prev, keywords: '' }));
                }}
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base bg-gray-50 ${errors.keywords ? 'border-red-300' : 'border-gray-300'}`}
                required
                placeholder="Enter keywords separated by commas"
              />
              {errors.keywords && (
                <p className="mt-1 text-sm text-red-600">{errors.keywords}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-base font-medium text-gray-800 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base bg-gray-50"
                disabled={submitting}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-semibold text-base hover:bg-emerald-700 transition disabled:opacity-50"
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
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={id ? 'Update Blog Post' : 'Create Blog Post'}
        size="small"
      >
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">
                {formData.status === 'published' ? 'This will be published immediately' : 'This will be saved as a draft'}
              </p>
            </div>
          </div>

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

          <div className="flex justify-end space-x-3 pt-4">
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
      </Modal>
    </div>
  );
}

export default BlogEditor; 