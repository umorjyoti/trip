// // Entire SEOAnalytics component is commented out for now
// /*
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const SEOAnalytics = ({ blogId, onUpdate }) => {
//   const [analytics, setAnalytics] = useState({
//     pageViews: 0,
//     uniqueVisitors: 0,
//     bounceRate: 0,
//     avgTimeOnPage: 0,
//     searchRankings: [],
//     socialShares: {
//       facebook: 0,
//       twitter: 0,
//       linkedin: 0
//     },
//     organicTraffic: 0,
//     keywordPositions: []
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (blogId) {
//       fetchAnalytics();
//     }
//   }, [blogId]);

//   const fetchAnalytics = async () => {
//     try {
//       setLoading(true);
//       // This would integrate with Google Analytics API or similar
//       // For now, we'll simulate the data
//       const mockData = {
//         pageViews: Math.floor(Math.random() * 1000) + 100,
//         uniqueVisitors: Math.floor(Math.random() * 500) + 50,
//         bounceRate: Math.random() * 30 + 20,
//         avgTimeOnPage: Math.floor(Math.random() * 300) + 60,
//         searchRankings: [
//           { keyword: 'trekking tips', position: Math.floor(Math.random() * 20) + 1 },
//           { keyword: 'hiking guide', position: Math.floor(Math.random() * 30) + 1 },
//           { keyword: 'adventure travel', position: Math.floor(Math.random() * 25) + 1 }
//         ],
//         socialShares: {
//           facebook: Math.floor(Math.random() * 50),
//           twitter: Math.floor(Math.random() * 30),
//           linkedin: Math.floor(Math.random() * 20)
//         },
//         organicTraffic: Math.floor(Math.random() * 200) + 50,
//         keywordPositions: [
//           { keyword: 'trekking tips', position: Math.floor(Math.random() * 20) + 1, change: Math.floor(Math.random() * 10) - 5 },
//           { keyword: 'hiking guide', position: Math.floor(Math.random() * 30) + 1, change: Math.floor(Math.random() * 10) - 5 },
//           { keyword: 'adventure travel', position: Math.floor(Math.random() * 25) + 1, change: Math.floor(Math.random() * 10) - 5 }
//         ]
//       };
      
//       setAnalytics(mockData);
//       setError(null);
//     } catch (err) {
//       setError('Failed to fetch analytics data');
//       console.error('Error fetching analytics:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getPositionColor = (position) => {
//     if (position <= 3) return 'text-green-600';
//     if (position <= 10) return 'text-yellow-600';
//     return 'text-red-600';
//   };

//   const getChangeIcon = (change) => {
//     if (change > 0) return '↗️';
//     if (change < 0) return '↘️';
//     return '→';
//   };

//   if (loading) {
//     return (
//       <div className="bg-white p-6 rounded-lg shadow-sm border">
//         <div className="animate-pulse">
//           <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
//           <div className="space-y-3">
//             <div className="h-3 bg-gray-200 rounded"></div>
//             <div className="h-3 bg-gray-200 rounded w-5/6"></div>
//             <div className="h-3 bg-gray-200 rounded w-4/6"></div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-white p-6 rounded-lg shadow-sm border">
//         <div className="text-red-600 text-center">{error}</div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-sm border">
//       <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Analytics</h3>
      
//       {/* Key Metrics */}
//       // <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//       //   <div className="text-center">
//       //     <div className="text-2xl font-bold text-emerald-600">{analytics.pageViews}</div>
//       //     <div className="text-sm text-gray-600">Page Views</div>
//       //   </div>
//       //   <div className="text-center">
//       //     <div className="text-2xl font-bold text-blue-600">{analytics.uniqueVisitors}</div>
//       //     <div className="text-sm text-gray-600">Unique Visitors</div>
//       //   </div>
//       //   <div className="text-center">
//       //     <div className="text-2xl font-bold text-purple-600">{analytics.bounceRate.toFixed(1)}%</div>
//       //     <div className="text-sm text-gray-600">Bounce Rate</div>
//       //   </div>
//       //   <div className="text-center">
//       //     <div className="text-2xl font-bold text-orange-600">{Math.floor(analytics.avgTimeOnPage / 60)}m {analytics.avgTimeOnPage % 60}s</div>
//       //     <div className="text-sm text-gray-600">Avg. Time</div>
//       //   </div>
//       // </div>

//       {/* Search Rankings */}
//       <div className="mb-6">
//         <h4 className="text-md font-medium text-gray-900 mb-3">Search Rankings</h4>
//         <div className="space-y-2">
//           {analytics.keywordPositions.map((item, index) => (
//             <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
//               <span className="text-sm text-gray-700">{item.keyword}</span>
//               <div className="flex items-center space-x-2">
//                 <span className={`text-sm font-medium ${getPositionColor(item.position)}`}>
//                   #{item.position}
//                 </span>
//                 <span className="text-xs text-gray-500">
//                   {getChangeIcon(item.change)} {Math.abs(item.change)}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Social Shares */}
//       <div className="mb-6">
//         <h4 className="text-md font-medium text-gray-900 mb-3">Social Shares</h4>
//         <div className="grid grid-cols-3 gap-4">
//           <div className="text-center p-3 bg-blue-50 rounded">
//             <div className="text-lg font-bold text-blue-600">{analytics.socialShares.facebook}</div>
//             <div className="text-xs text-gray-600">Facebook</div>
//           </div>
//           <div className="text-center p-3 bg-sky-50 rounded">
//             <div className="text-lg font-bold text-sky-600">{analytics.socialShares.twitter}</div>
//             <div className="text-xs text-gray-600">Twitter</div>
//           </div>
//           <div className="text-center p-3 bg-blue-50 rounded">
//             <div className="text-lg font-bold text-blue-700">{analytics.socialShares.linkedin}</div>
//             <div className="text-xs text-gray-600">LinkedIn</div>
//           </div>
//         </div>
//       </div>

//       {/* Organic Traffic */}
//       <div>
//         <h4 className="text-md font-medium text-gray-900 mb-3">Organic Traffic</h4>
//         <div className="bg-emerald-50 p-4 rounded">
//           <div className="text-2xl font-bold text-emerald-600">{analytics.organicTraffic}</div>
//           <div className="text-sm text-gray-600">Visitors from search engines</div>
//         </div>
//       </div>

//       {/* SEO Recommendations */}
//       <div className="mt-6 pt-4 border-t border-gray-200">
//         <h4 className="text-md font-medium text-gray-900 mb-3">SEO Recommendations</h4>
//         <div className="space-y-2">
//           {analytics.bounceRate > 50 && (
//             <div className="flex items-start space-x-2">
//               <span className="text-yellow-500">⚠️</span>
//               <span className="text-sm text-gray-700">High bounce rate. Consider improving content engagement.</span>
//             </div>
//           )}
//           {analytics.avgTimeOnPage < 120 && (
//             <div className="flex items-start space-x-2">
//               <span className="text-yellow-500">⚠️</span>
//               <span className="text-sm text-gray-700">Low time on page. Content might need improvement.</span>
//             </div>
//           )}
//           {analytics.keywordPositions.some(k => k.position > 10) && (
//             <div className="flex items-start space-x-2">
//               <span className="text-blue-500">💡</span>
//               <span className="text-sm text-gray-700">Some keywords need optimization for better rankings.</span>
//             </div>
//           )}
//           <div className="flex items-start space-x-2">
//             <span className="text-green-500">✅</span>
//             <span className="text-sm text-gray-700">Good organic traffic performance.</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SEOAnalytics;
// */

// // Temporary placeholder
// const SEOAnalytics = () => null;
// export default SEOAnalytics;