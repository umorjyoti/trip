import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { getBlogRegionBySlug, getBlogsByRegion } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function BlogRegionPage() {
  const { slug } = useParams();
  const [region, setRegion] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRegionAndBlogs();
  }, [slug, currentPage]);

  const fetchRegionAndBlogs = async () => {
    try {
      setLoading(true);
      
      // Fetch region details
      const regionResponse = await getBlogRegionBySlug(slug);
      setRegion(regionResponse);
      
      // Fetch blogs for this region
      const blogsResponse = await getBlogsByRegion(regionResponse._id, {
        page: currentPage,
        limit: 9
      });
      
      setBlogs(blogsResponse.blogs);
      setTotalPages(blogsResponse.totalPages);
      setError(null);
    } catch (err) {
      setError('Failed to fetch region or blogs. Please try again later.');
      console.error('Error fetching region and blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !region) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Region Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested region could not be found.'}</p>
          <Link
            to="/blogs"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
          >
            Back to All Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${region.name} - Blog Posts | Bengaluru Trekkers`}</title>
        <meta name="description" content={`Discover blog posts about ${region.name}. Read travel stories, tips, and adventures from ${region.name}.`} />
        <meta name="keywords" content={`${region.name}, travel blog, trekking, adventure, ${region.name} travel`} />
        <link rel="canonical" href={`${window.location.origin}/blogs/region/${region.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${region.name} - Blog Posts | Bengaluru Trekkers`} />
        <meta property="og:description" content={`Discover blog posts about ${region.name}. Read travel stories, tips, and adventures.`} />
        <meta property="og:image" content={region.image} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/blogs/region/${region.slug}`} />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${region.name} - Blog Posts | Bengaluru Trekkers`} />
        <meta name="twitter:description" content={`Discover blog posts about ${region.name}. Read travel stories, tips, and adventures.`} />
        <meta name="twitter:image" content={region.image} />
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
              <li>
                <a href="/blogs" className="hover:text-emerald-600">Blog</a>
              </li>
              <li>
                <span className="mx-2">/</span>
              </li>
              <li className="text-gray-900 font-medium">
                {region.name}
              </li>
            </ol>
          </div>
        </nav>

        {/* Region Banner */}
        <div className="relative h-96 bg-emerald-600">
          <img
            src={region.image}
            alt={region.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative h-full flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{region.name}</h1>
              <p className="text-xl md:text-2xl max-w-2xl mx-auto">{region.description}</p>
            </div>
          </div>
        </div>

        {/* Blog List Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Blog Posts from {region.name}
            </h2>
            <p className="text-gray-600">
              {blogs.length > 0 
                ? `Showing ${blogs.length} blog post${blogs.length === 1 ? '' : 's'} from ${region.name}`
                : `No blog posts found for ${region.name} yet.`
              }
            </p>
          </div>

          {blogs.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No blogs found</h3>
              <p className="text-gray-500 mb-4">
                No blog posts have been published for {region.name} yet.
              </p>
              <Link
                to="/blogs"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
              >
                View All Blogs
              </Link>
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
                      <div className="flex items-center mb-2">
                        <img
                          src={region.image}
                          alt={region.name}
                          className="w-4 h-4 rounded-full mr-2"
                        />
                        <span className="text-sm text-emerald-600 font-medium">
                          {region.name}
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                        {blog.title}
                      </h2>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                        {blog.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>By {blog.author.name}</span>
                        <span>{format(new Date(blog.publishedAt), 'MMM dd, yyyy')}</span>
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

export default BlogRegionPage; 