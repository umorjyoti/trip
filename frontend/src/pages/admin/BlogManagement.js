import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import RichTextEditor from '../../components/RichTextEditor';

function BlogManagement() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bannerImageFile, setBannerImageFile] = useState(null);
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
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/blogs/admin');
      setBlogs(response.data);
    } catch (error) {
      toast.error('Failed to fetch blogs');
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/api/blogs/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.url;
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Error uploading image:', error);
      return '';
    }
  };

  const handleBannerImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerImageFile(file);
      // Create a preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, bannerImage: previewUrl }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let bannerImageUrl = formData.bannerImage;

      // If there's a new banner image file, upload it first
      if (bannerImageFile) {
        bannerImageUrl = await handleImageUpload(bannerImageFile);
      }

      const blogData = {
        ...formData,
        bannerImage: bannerImageUrl
      };

      if (isEditing) {
        await axios.put(`/api/blogs/${selectedBlog._id}`, blogData);
        toast.success('Blog updated successfully');
      } else {
        await axios.post('/api/blogs', blogData);
        toast.success('Blog created successfully');
      }
      fetchBlogs();
      resetForm();
    } catch (error) {
      toast.error(isEditing ? 'Failed to update blog' : 'Failed to create blog');
      console.error('Error saving blog:', error);
    }
  };

  const handleEdit = (blog) => {
    setSelectedBlog(blog);
    setIsEditing(true);
    setBannerImageFile(null);
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
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      try {
        await axios.delete(`/api/blogs/${id}`);
        toast.success('Blog deleted successfully');
        fetchBlogs();
      } catch (error) {
        toast.error('Failed to delete blog');
        console.error('Error deleting blog:', error);
      }
    }
  };

  const resetForm = () => {
    setSelectedBlog(null);
    setIsEditing(false);
    setBannerImageFile(null);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      bannerImage: '',
      metaTitle: '',
      metaDescription: '',
      keywords: '',
      status: 'draft'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
        <button
          onClick={resetForm}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700"
        >
          New Blog
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Blog List */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Blogs</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : (
                blogs.map((blog) => (
                  <div key={blog._id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{blog.title}</h3>
                        <p className="text-sm text-gray-500">
                          {format(new Date(blog.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(blog)}
                          className="text-emerald-600 hover:text-emerald-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(blog._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Blog Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  onImageUpload={handleImageUpload}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Banner Image</label>
                <div className="mt-1 flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerImageChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-emerald-50 file:text-emerald-700
                      hover:file:bg-emerald-100"
                  />
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Meta Title</label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Meta Description</label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  {isEditing ? 'Update Blog' : 'Create Blog'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BlogManagement; 