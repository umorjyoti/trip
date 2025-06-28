import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaTrash, FaFilePdf, FaFileWord } from 'react-icons/fa';
import api from '../services/api';

function Career() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    message: '',
    skillsAndExperience: ''
  });
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOC, or DOCX file');
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResumeUrl(response.data.url);
      setResumeFileName(file.name);
      toast.success('Resume uploaded successfully!');
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast.error('Failed to upload resume. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!resumeUrl) return;
    
    try {
      // Extract the S3 key from the URL
      const urlParts = resumeUrl.split('.com/');
      if (urlParts.length !== 2) throw new Error('Invalid S3 URL format');
      const key = encodeURIComponent(urlParts[1]);
      
      await api.delete(`/upload/${key}`);
      setResumeUrl('');
      setResumeFileName('');
      toast.success('Resume deleted successfully!');
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!resumeUrl) {
      toast.error('Please upload your resume');
      return;
    }

    setIsSubmitting(true);

    try {
      const applicationData = {
        name: formData.name,
        email: formData.email,
        contactNumber: formData.contactNumber,
        message: formData.message,
        skillsAndExperience: formData.skillsAndExperience,
        resumeUrl: resumeUrl,
        resumeFileName: resumeFileName
      };

      const response = await api.post('/careers', applicationData);

      toast.success('Career application submitted successfully!');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        contactNumber: '',
        message: '',
        skillsAndExperience: ''
      });
      setResumeUrl('');
      setResumeFileName('');
      
      // Reset file input
      const fileInput = document.getElementById('resumeFile');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error submitting career application:', error);
      const message = error.response?.data?.message || 'Failed to submit application. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (fileName) => {
    if (fileName.toLowerCase().endsWith('.pdf')) {
      return <FaFilePdf className="w-8 h-8 text-red-500" />;
    }
    return <FaFileWord className="w-8 h-8 text-blue-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Join Our Team
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're always looking for passionate individuals to join our trekking adventures. 
            Share your skills and experience with us!
          </p>
        </div>

        {/* Career Application Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Career Application Form
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your email address"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number *
              </label>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your contact number"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Why would you like to join our team? *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Tell us why you'd like to join our team and what interests you about trekking and adventure tourism..."
              />
            </div>

            {/* Skills and Experience */}
            <div>
              <label htmlFor="skillsAndExperience" className="block text-sm font-medium text-gray-700 mb-2">
                Skills and Experience *
              </label>
              <textarea
                id="skillsAndExperience"
                name="skillsAndExperience"
                value={formData.skillsAndExperience}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Please describe your relevant skills, experience, and qualifications. Include any experience in tourism, hospitality, outdoor activities, or customer service..."
              />
            </div>

            {/* Resume Upload */}
            <div>
              <label htmlFor="resumeFile" className="block text-sm font-medium text-gray-700 mb-2">
                Resume/CV *
              </label>
              
              {resumeUrl ? (
                // Show uploaded file with delete option
                <div className="mt-1 flex items-center justify-between p-4 border border-gray-300 rounded-md bg-gray-50">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(resumeFileName)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{resumeFileName}</p>
                      <p className="text-xs text-gray-500">Resume uploaded successfully</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteResume}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete resume"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                // Show upload area
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="resumeFile"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500"
                      >
                        <span>{isUploading ? 'Uploading...' : 'Upload a file'}</span>
                        <input
                          id="resumeFile"
                          name="resumeFile"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="sr-only"
                          disabled={isUploading}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, or DOCX up to 5MB
                    </p>
                  </div>
                </div>
              )}
              
              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>

        {/* Additional Information */}
        <div className="mt-12 bg-emerald-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-emerald-900 mb-4">
            What to Expect
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-emerald-800 mb-2">Application Process</h4>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• Submit your application with resume</li>
                <li>• We'll review your application within 1-2 weeks</li>
                <li>• Shortlisted candidates will be contacted for interviews</li>
                <li>• Final selection and onboarding process</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-emerald-800 mb-2">What We Look For</h4>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• Passion for outdoor activities and adventure</li>
                <li>• Strong communication and customer service skills</li>
                <li>• Team player with leadership potential</li>
                <li>• Relevant experience in tourism or hospitality</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Career; 