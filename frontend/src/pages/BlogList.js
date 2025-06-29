import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { debounce } from 'lodash';
import { Helmet } from 'react-helmet-async';

function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-publishedAt');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, search, sort]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/blogs?page=${currentPage}&search=${search}&sort=${sort}`);
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

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

        {/* Search and Sort Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="w-full md:w-96">
              <input
                type="text"
                placeholder="Search blogs..."
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
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
                {search ? 'Try adjusting your search or filters' : 'Check back later for new content'}
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
      </div>
    </>
  );
}

export default BlogList; 