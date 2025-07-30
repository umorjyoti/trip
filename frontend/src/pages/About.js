import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGlobe, FaCloudRain, FaSun, FaMountain, FaHiking, FaCalendarWeek } from 'react-icons/fa';
import { getTreks } from '../services/api';
import chanduImage from '../assets/chandu.png';
import vraunImage from '../assets/vraun.png';
import sureshImage from '../assets/suresh.png';
import karthikImage from '../assets/karthik.png';

function About() {
  const navigate = useNavigate();
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    const fetchAvailableCategories = async () => {
      try {
        const treks = await getTreks({ limit: 100 });
        const trekData = Array.isArray(treks) ? treks : [];
        
        // Get unique categories from treks
        const trekCategories = [...new Set(trekData.map(trek => trek.category).filter(Boolean))];
        
        // Define all possible categories with their metadata
        const allCategories = [
          {
            name: "All Treks",
            value: "all-treks",
            icon: FaGlobe,
            color: "from-blue-500 to-emerald-500",
            description: "Explore all our trekking adventures",
          },
          {
            name: "Monsoon Treks",
            value: "monsoon-treks",
            icon: FaCloudRain,
            color: "from-blue-400 to-blue-600",
            description: "Rain-soaked trails and lush greenery",
          },
          {
            name: "Sunrise Treks",
            value: "sunrise-treks",
            icon: FaSun,
            color: "from-yellow-500 to-orange-500",
            description: "Early morning adventures with stunning views",
          },
          {
            name: "Himalayan Treks",
            value: "himalayan-treks",
            icon: FaMountain,
            color: "from-gray-600 to-gray-700",
            description: "High-altitude mountain expeditions",
          },
          {
            name: "Backpacking Trips",
            value: "backpacking-trips",
            icon: FaHiking,
            color: "from-red-500 to-red-600",
            description: "Multi-day adventure expeditions",
          },
          {
            name: "Long Weekend",
            value: "long-weekend",
            icon: FaCalendarWeek,
            color: "from-purple-400 to-purple-600",
            description: "Extended weekend getaways",
          },
        ];
        
        // Filter to only include categories that have treks
        const available = allCategories.filter(category => 
          category.value === 'all-treks' || trekCategories.includes(category.value)
        );
        
        setAvailableCategories(available);
      } catch (error) {
        console.error('Error fetching available categories:', error);
        // Fallback to showing all categories if there's an error
        setAvailableCategories([
          {
            name: "All Treks",
            value: "all-treks",
            icon: FaGlobe,
            color: "from-blue-500 to-emerald-500",
            description: "Explore all our trekking adventures",
          }
        ]);
      }
    };

    fetchAvailableCategories();
  }, []);

  // Team members data
  const teamMembers = [
    {
      name: "Chandu MR",
      role: "Chief Executive Officer (CEO)",
      image: chanduImage,
      hasImage: true,
    },
    {
      name: "Varun H",
      role: "Chief Operating Officer (COO)",
      image: vraunImage,
      hasImage: true,
    },
    {
      name: "Suresh C T",
      role: "Chief Financial Officer (CFO)",
      image: sureshImage,
      hasImage: true,
    },
    {
      name: "Karthik Bhatta",
      role: "Chief Marketing Officer (CMO)",
      image: karthikImage,
      hasImage: true,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 sm:mb-8">
              About <span className="text-emerald-600">TrekEase</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              We're passionate about creating unforgettable trekking experiences that connect people with nature's most breathtaking landscapes.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                To make adventure accessible to everyone by providing safe, well-organized trekking experiences that inspire a deeper connection with nature and create lasting memories.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We believe that every trek is not just a journey through landscapes, but a journey of self-discovery and personal growth.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">500+</div>
                  <div className="text-gray-600">Happy Trekkers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">50+</div>
                  <div className="text-gray-600">Unique Treks</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                  alt="Trekking adventure"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trek Categories Section */}
      {availableCategories.length > 0 && (
        <section className="py-12 sm:py-20 bg-gradient-to-r from-gray-50 to-emerald-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Explore Our Trek Categories
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                Discover diverse trekking experiences tailored to every
                adventurer's preference
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {availableCategories.map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={index}
                    onClick={() => navigate(`/treks?category=${category.value}`)}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 p-4 sm:p-6 text-center border border-gray-100"
                  >
                    <div
                      className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${category.color} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="text-white text-lg sm:text-xl" />
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-tight">
                      {category.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Team Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Meet Our Team
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              The passionate individuals behind TrekEase who make your adventures possible
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-6">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    {member.hasImage ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                  {member.name}
                </h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Our Values
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Safety First</h3>
              <p className="text-gray-600">
                Your safety is our top priority. We maintain the highest standards of safety protocols and equipment.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Passion for Adventure</h3>
              <p className="text-gray-600">
                We're driven by our love for adventure and the outdoors, and we want to share that passion with you.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Community Building</h3>
              <p className="text-gray-600">
                We believe in building a community of adventurers who support and inspire each other.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-3xl mx-auto">
            Join us on an unforgettable journey through some of the most beautiful landscapes in the world.
          </p>
          <button
            onClick={() => navigate('/treks')}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-emerald-600 bg-white hover:bg-gray-50 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Explore Our Treks
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </section>
    </div>
  );
}

export default About;
