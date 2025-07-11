import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { debounce } from 'lodash';
import { Helmet } from 'react-helmet-async';
import { FaGlobe, FaArrowRight, FaNewspaper, FaSearch } from 'react-icons/fa';
import api from '../services/api';
import { getBlogRegions, getBlogsByRegion } from '../services/api';

function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-publishedAt');
  const [region, setRegion] = useState('');
  const [blogRegions, setBlogRegions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState('regions'); // 'regions' or 'blogs'
  const [regionBlogCounts, setRegionBlogCounts] = useState({});

  useEffect(() => {
    fetchBlogRegions();
    if (viewMode === 'blogs') {
      fetchBlogs();
    }
  }, [currentPage, search, sort, region, viewMode]);

  const fetchBlogRegions = async () => {
    try {
      const response = await getBlogRegions();
      setBlogRegions(response);
      
      // Fetch blog counts for each region
      const counts = {};
      for (const region of response) {
        try {
          const blogsResponse = await getBlogsByRegion(region._id, { limit: 1 });
          counts[region._id] = blogsResponse.total || 0;
        } catch (error) {
          counts[region._id] = 0;
        }
      }
      setRegionBlogCounts(counts);
    } catch (error) {
      console.error('Error fetching blog regions:', error);
    }
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        search: search,
        sort: sort
      });
      
      if (region) {
        params.append('region', region);
      }
      
      const response = await api.get(`/blogs?${params.toString()}`);
      setBlogs(response.data.blogs);
      setTotalPages(response.data.totalPages);
      setError(null);
    } catch (err) {
      setError('Failed to fetch blogs. Please try again later.');
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleSearch = debounce((value) => {
    setIsSearching(true);
    setSearch(value);
    setCurrentPage(1); // Reset to first page when searching
  }, 500);

  const handleSort = (value) => {
    setIsSearching(true);
    setSort(value);
    setCurrentPage(1); // Reset to first page when changing sort
  };

  const handleRegionChange = (value) => {
    setIsSearching(true);
    setRegion(value);
    setCurrentPage(1); // Reset to first page when changing region
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const switchToBlogsView = () => {
    setViewMode('blogs');
    setSearch('');
    setRegion('');
    setCurrentPage(1);
  };

  // Generate JSON-LD structured data for blog list
  const generateStructuredData = () => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Blog Posts",
      "description": "Discover stories, tips, and adventures from our travel blog",
      "url": `${window.location.origin}/blogs`,
      "numberOfItems": blogs.length,
      "itemListElement": blogs.map((blog, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "BlogPosting",
          "headline": blog.title,
          "description": blog.excerpt,
          "image": blog.bannerImage,
          "author": {
            "@type": "Person",
            "name": blog.author.name
          },
          "datePublished": blog.publishedAt,
          "url": `${window.location.origin}/blogs/${blog.slug}`
        }
      }))
    };

    return JSON.stringify(structuredData);
  };

  return (
    <>
      <Helmet>
        <title>Blog - Trek Adventures | Travel Stories & Tips</title>
        <meta name="description" content="Discover amazing travel stories, trekking tips, and adventure guides from our expert team. Read about the best trekking destinations and travel experiences." />
        <meta name="keywords" content="travel blog, trekking tips, adventure stories, hiking guides, travel tips, trek adventures" />
        <link rel="canonical" href={`${window.location.origin}/blogs`} />
        
        {/* Open Graph */}
        <meta property="og:title" content="Blog - Trek Adventures | Travel Stories & Tips" />
        <meta property="og:description" content="Discover amazing travel stories, trekking tips, and adventure guides from our expert team." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/blogs`} />
        <meta property="og:site_name" content="Trek Adventures" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Blog - Trek Adventures | Travel Stories & Tips" />
        <meta name="twitter:description" content="Discover amazing travel stories, trekking tips, and adventure guides from our expert team." />
        <meta name="twitter:site" content="@trekadventures" />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {generateStructuredData()}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li>
                <a href="/" className="hover:text-emerald-600">Home</a>
              </li>
              <li>
                <span className="mx-2">/</span>
              </li>
              <li className="text-gray-900 font-medium">
                Blog
              </li>
            </ol>
          </div>
        </nav>

        {/* Banner Section */}
        <div className="relative h-96 bg-emerald-600">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative h-full flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Blog</h1>
              <p className="text-xl md:text-2xl">Discover stories, tips, and adventures</p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-md flex flex-row gap-2 p-1">
              <button
                onClick={() => setViewMode('regions')}
                className={`flex-1 px-2 py-3 rounded-md font-medium text-sm transition-all duration-200 ${
                  viewMode === 'regions'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FaGlobe className="inline mr-2 h-4 w-4" />
                Browse by Region
              </button>
              <button
                onClick={switchToBlogsView}
                className={`flex-1 px-2 py-3 rounded-md font-medium text-sm transition-all duration-200 ${
                  viewMode === 'blogs'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FaNewspaper className="inline mr-2 h-4 w-4" />
                View All Blogs
              </button>
            </div>
          </div>
        </div>

        {/* Regions View */}
        {viewMode === 'regions' && (
          <div className="max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            {blogRegions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <FaGlobe className="mx-auto h-16 w-16" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No regions available</h3>
                <p className="text-gray-500">Blog regions will appear here once they are created.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogRegions.map((region) => (
                  <Link
                    key={region._id}
                    to={`/blogs/region/${region.slug}`}
                    className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={region.image}
                        alt={region.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white mb-2">{region.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/90">
                            {regionBlogCounts[region._id] || 0} blog posts
                          </span>
                          <div className="flex items-center text-white/90 group-hover:text-white transition-colors duration-200">
                            <span className="text-sm mr-1">Explore</span>
                            <FaArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 line-clamp-3 leading-relaxed">
                        {region.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

          </div>
        )}

        {/* Blogs View */}
        {viewMode === 'blogs' && (
          <div className="max-w-7xl px-4 sm:px-6 lg:px-8 ">
            {/* Search and Sort Section */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 gap-3 mb-4">
              <div className="w-full md:w-80">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search blogs..."
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <select
                  value={sort}
                  onChange={(e) => handleSort(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="-publishedAt">Newest First</option>
                  <option value="publishedAt">Oldest First</option>
                  <option value="title">Title A-Z</option>
                  <option value="-title">Title Z-A</option>
                </select>
              </div>
            </div>

            {/* Blog Grid Section */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-600">{error}</div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No blogs found</h3>
                <p className="text-gray-500">
                  {search || region ? 'Try adjusting your search or filters' : 'Check back later for new content'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {blogs.map((blog) => (
                    <Link
                      key={blog._id}
                      to={`/blogs/${blog.slug}`}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                    >
                      <div className="aspect-w-16 aspect-h-9">
                        <img
                          src={blog.bannerImage}
                          alt={blog.title}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                      <div className="p-6">
                        {blog.region && (
                          <div className="flex items-center mb-2">
                            <img
                              src={blog.region.image}
                              alt={blog.region.name}
                              className="w-4 h-4 rounded-full mr-2"
                            />
                            <span className="text-sm text-emerald-600 font-medium">
                              {blog.region.name}
                            </span>
                          </div>
                        )}
                        <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                          {blog.title}
                        </h2>
                        <p className="text-gray-600 mb-4 line-clamp-3">{blog.excerpt}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{blog.author.name}</span>
                          <span>{format(new Date(blog.publishedAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === page
                              ? 'bg-emerald-600 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default BlogList; 