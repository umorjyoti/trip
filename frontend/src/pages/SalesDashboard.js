import React, { useState, useEffect } from 'react';
import { getSalesStats, getSalesTreks, getSalesBatches } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrencyWithSuffix, formatNumberWithSuffix } from '../utils/formatters';
import CustomTooltip from '../components/CustomTooltip';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import PromoCodeManager from '../components/PromoCodeManager';
import OfferManager from '../components/OfferManager';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title,
  PointElement,
  LineElement
);

function SalesDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month'); // month, quarter, year, custom
  const [chartType, setChartType] = useState('revenue'); // revenue, bookings, regions, treks, batches
  const [activeTab, setActiveTab] = useState('overview'); // overview, promos, offers
  
  // New filter states
  const [filters, setFilters] = useState({
    trekId: '',
    batchId: '',
    startDate: '',
    endDate: ''
  });
  
  // Data for filter dropdowns
  const [treks, setTreks] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchSalesStats();
      fetchFilterData();
    }
  }, [timeRange, activeTab, filters]);

  const fetchSalesStats = async () => {
    try {
      setLoading(true);
      
      // Build params object
      const params = { timeRange };
      
      // Add custom date range if selected
      if (timeRange === 'custom' && filters.startDate && filters.endDate) {
        params.startDate = filters.startDate;
        params.endDate = filters.endDate;
      }
      
      // Add trek and batch filters
      if (filters.trekId) params.trekId = filters.trekId;
      if (filters.batchId) params.batchId = filters.batchId;
      
      const data = await getSalesStats(params);
      setStats(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      setError('Failed to load sales statistics');
      toast.error('Failed to load sales statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      setLoadingFilters(true);
      const [treksData, batchesData] = await Promise.all([
        getSalesTreks(),
        getSalesBatches(filters.trekId || null)
      ]);
      setTreks(treksData);
      setBatches(batchesData);
    } catch (error) {
      console.error('Error fetching filter data:', error);
      toast.error('Failed to load filter options');
    } finally {
      setLoadingFilters(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If trek changes, reset batch selection
    if (name === 'trekId') {
      setFilters(prev => ({
        ...prev,
        batchId: ''
      }));
    }
  };

  const handleTimeRangeChange = (e) => {
    const value = e.target.value;
    setTimeRange(value);
    
    // Clear custom dates if not using custom range
    if (value !== 'custom') {
      setFilters(prev => ({
        ...prev,
        startDate: '',
        endDate: ''
      }));
    }
  };

  const clearFilters = () => {
    setFilters({
      trekId: '',
      batchId: '',
      startDate: '',
      endDate: ''
    });
    setTimeRange('month');
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(0);
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Sales Dashboard</h1>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Sales Overview
            </button>
            <button
              onClick={() => setActiveTab('promos')}
              className={`${
                activeTab === 'promos'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Promo Codes
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`${
                activeTab === 'offers'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Limited-Time Offers
            </button>
          </nav>
        </div>
      </div>
      
      {activeTab === 'promos' ? (
        <PromoCodeManager />
      ) : activeTab === 'offers' ? (
        <OfferManager />
      ) : (
        <>
          {/* Filters Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Time Range */}
              <div>
                <label htmlFor="time-range" className="block text-sm font-medium text-gray-700 mb-1">
                  Time Range
                </label>
                <select
                  id="time-range"
                  value={timeRange}
                  onChange={handleTimeRangeChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                >
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Trek Filter */}
              <div>
                <label htmlFor="trek-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Trek
                </label>
                <select
                  id="trek-filter"
                  name="trekId"
                  value={filters.trekId}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                >
                  <option value="">All Treks</option>
                  {treks.map(trek => (
                    <option key={trek._id} value={trek._id}>
                      {trek.name} ({trek.region})
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Filter */}
              <div>
                <label htmlFor="batch-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Batch
                </label>
                <select
                  id="batch-filter"
                  name="batchId"
                  value={filters.batchId}
                  onChange={handleFilterChange}
                  disabled={!filters.trekId}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md disabled:bg-gray-100"
                >
                  <option value="">All Batches</option>
                  {batches.map(batch => (
                    <option key={batch.id} value={batch.id}>
                      {batch.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Custom Date Range */}
            {timeRange === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start-date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end-date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                  />
                </div>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : stats ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Revenue
                    </dt>
                    <CustomTooltip 
                      content={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`}
                      position="top"
                    >
                      <dd className="mt-1 text-3xl font-semibold text-gray-900 cursor-help">
                        {formatCurrencyWithSuffix(stats.totalRevenue || 0)}
                      </dd>
                    </CustomTooltip>
                  </div>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Bookings
                    </dt>
                    <CustomTooltip 
                      content={(stats.totalBookings || 0).toLocaleString('en-IN')}
                      position="top"
                    >
                      <dd className="mt-1 text-3xl font-semibold text-gray-900 cursor-help">
                        {formatNumberWithSuffix(stats.totalBookings || 0)}
                      </dd>
                    </CustomTooltip>
                  </div>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Average Booking Value
                    </dt>
                    <CustomTooltip 
                      content={`₹${(stats.avgBookingValue || 0).toLocaleString('en-IN')}`}
                      position="top"
                    >
                      <dd className="mt-1 text-3xl font-semibold text-gray-900 cursor-help">
                        {formatCurrencyWithSuffix(stats.avgBookingValue || 0)}
                      </dd>
                    </CustomTooltip>
                  </div>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Average Participants
                    </dt>
                    <CustomTooltip 
                      content={(stats.avgParticipants || 0).toFixed(1)}
                      position="top"
                    >
                      <dd className="mt-1 text-3xl font-semibold text-gray-900 cursor-help">
                        {(stats.avgParticipants || 0).toFixed(1)}
                      </dd>
                    </CustomTooltip>
                  </div>
                </div>
              </div>
              
              {/* Chart Type Selector */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setChartType('revenue')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      chartType === 'revenue'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Revenue Over Time
                  </button>
                  <button
                    onClick={() => setChartType('bookings')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      chartType === 'bookings'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Bookings Over Time
                  </button>
                  <button
                    onClick={() => setChartType('regions')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      chartType === 'regions'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Revenue by Region
                  </button>
                  <button
                    onClick={() => setChartType('treks')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      chartType === 'treks'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Revenue by Trek
                  </button>
                  <button
                    onClick={() => setChartType('batches')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      chartType === 'batches'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Revenue by Batch
                  </button>
                </div>
              </div>
              
              {/* Charts */}
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                {chartType === 'revenue' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Over Time</h3>
                    <div className="h-80">
                      <Line
                        data={{
                          labels: (stats.revenueByPeriod || []).map(item => item.period),
                          datasets: [
                            {
                              label: 'Revenue (INR)',
                              data: (stats.revenueByPeriod || []).map(item => item.amount),
                              borderColor: 'rgb(16, 185, 129)',
                              backgroundColor: 'rgba(16, 185, 129, 0.5)',
                              tension: 0.1
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: function(value) {
                                  return formatCurrency(value);
                                }
                              }
                            }
                          },
                          plugins: {
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return formatCurrency(context.raw);
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {chartType === 'bookings' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Bookings Over Time</h3>
                    <div className="h-80">
                      <Bar
                        data={{
                          labels: (stats.bookingsByPeriod || []).map(item => item.period),
                          datasets: [
                            {
                              label: 'Bookings',
                              data: (stats.bookingsByPeriod || []).map(item => item.count),
                              backgroundColor: 'rgba(16, 185, 129, 0.5)',
                              borderColor: 'rgb(16, 185, 129)',
                              borderWidth: 1
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                stepSize: 1
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {chartType === 'regions' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Region</h3>
                    <div className="h-80 flex justify-center">
                      <div style={{ width: '50%' }}>
                        <Pie
                          data={{
                            labels: (stats.revenueByRegion || []).map(item => item.region),
                            datasets: [
                              {
                                label: 'Revenue',
                                data: (stats.revenueByRegion || []).map(item => item.amount),
                                backgroundColor: [
                                  'rgba(16, 185, 129, 0.7)',
                                  'rgba(14, 165, 233, 0.7)',
                                  'rgba(168, 85, 247, 0.7)',
                                  'rgba(249, 115, 22, 0.7)',
                                  'rgba(239, 68, 68, 0.7)',
                                  'rgba(234, 179, 8, 0.7)'
                                ],
                                borderColor: [
                                  'rgb(16, 185, 129)',
                                  'rgb(14, 165, 233)',
                                  'rgb(168, 85, 247)',
                                  'rgb(249, 115, 22)',
                                  'rgb(239, 68, 68)',
                                  'rgb(234, 179, 8)'
                                ],
                                borderWidth: 1
                              }
                            ]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {chartType === 'treks' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Trek</h3>
                    <div className="h-80">
                      <Bar
                        data={{
                          labels: (stats.revenueByTrek || []).map(item => item.name),
                          datasets: [
                            {
                              label: 'Revenue (INR)',
                              data: (stats.revenueByTrek || []).map(item => item.revenue),
                              backgroundColor: 'rgba(14, 165, 233, 0.5)',
                              borderColor: 'rgb(14, 165, 233)',
                              borderWidth: 1
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: function(value) {
                                  return formatCurrency(value);
                                }
                              }
                            }
                          },
                          plugins: {
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return formatCurrency(context.raw);
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {chartType === 'batches' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Batch</h3>
                    <div className="h-80">
                      <Bar
                        data={{
                          labels: (stats.revenueByBatch || []).map(item => [item.formattedDate, item.trekName]),
                          datasets: [
                            {
                              label: 'Revenue (INR)',
                              data: (stats.revenueByBatch || []).map(item => item.revenue),
                              backgroundColor: 'rgba(168, 85, 247, 0.5)',
                              borderColor: 'rgb(168, 85, 247)',
                              borderWidth: 1
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            x: {
                              ticks: {
                                callback: function(value, index) {
                                  const labels = this.getLabelForValue(value);
                                  if (Array.isArray(labels)) {
                                    return labels;
                                  }
                                  return labels;
                                }
                              }
                            },
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: function(value) {
                                  return formatCurrency(value);
                                }
                              }
                            }
                          },
                          plugins: {
                            tooltip: {
                              callbacks: {
                                title: function(context) {
                                  const dataIndex = context[0].dataIndex;
                                  const batch = stats.revenueByBatch[dataIndex];
                                  return [
                                    `Date: ${batch.formattedDate}`,
                                    `Trek: ${batch.trekName}`
                                  ];
                                },
                                label: function(context) {
                                  return formatCurrency(context.raw);
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Top Performing Treks */}
              <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Top Performing Treks
                  </h3>
                </div>
                <div className="border-t border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trek Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Region
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bookings
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue (INR)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(stats.topTreks || []).map((trek, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {trek.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {trek.region}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {trek.bookings}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(trek.revenue || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No sales data available.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SalesDashboard; 