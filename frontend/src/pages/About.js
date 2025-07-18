import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMountain, FaWater, FaUmbrellaBeach, FaHiking, FaGlassCheers, FaTheaterMasks, FaMusic, FaGlobe } from 'react-icons/fa';

function About() {
  const navigate = useNavigate();
  // Corporate treks data
  const corporateTreks = [
    {
      company: "Infosys",
      logo: "🏢",
      description: "Team building trek to Kudremukh",
      details: "50+ employees, 3-day adventure"
    },
    {
      company: "Wipro",
      logo: "🏢",
      description: "Corporate retreat to Coorg",
      details: "75+ participants, weekend getaway"
    },
    {
      company: "TCS",
      logo: "🏢",
      description: "Leadership trek to Kodachadri",
      details: "30+ managers, team bonding"
    },
    {
      company: "Accenture",
      logo: "🏢",
      description: "Adventure challenge in Sakleshpur",
      details: "40+ employees, outdoor training"
    },
    {
      company: "Cognizant",
      logo: "🏢",
      description: "Wellness trek to Chikmagalur",
      details: "60+ staff, health & fitness focus"
    },
    {
      company: "Tech Mahindra",
      logo: "🏢",
      description: "Corporate expedition to Mullayanagiri",
      details: "45+ team members, peak climbing"
    }
  ];

  // Trek categories data
  const trekCategories = [
    {
      name: "All Treks",
      icon: FaGlobe,
      color: "from-blue-500 to-emerald-500",
      description: "Explore all our trekking adventures"
    },
    {
      name: "Mountains",
      icon: FaMountain,
      color: "from-gray-600 to-gray-700",
      description: "High-altitude mountain expeditions"
    },
    {
      name: "Coastal",
      icon: FaWater,
      color: "from-blue-400 to-blue-600",
      description: "Scenic coastal and beach treks"
    },
    {
      name: "Desert",
      icon: FaUmbrellaBeach,
      color: "from-yellow-500 to-orange-500",
      description: "Desert and arid landscape adventures"
    },
    {
      name: "Adventure",
      icon: FaHiking,
      color: "from-red-500 to-red-600",
      description: "Thrilling adventure activities"
    },
    {
      name: "Relaxing",
      icon: FaGlassCheers,
      color: "from-purple-400 to-purple-600",
      description: "Peaceful and rejuvenating treks"
    },
    {
      name: "Cultural",
      icon: FaTheaterMasks,
      color: "from-indigo-500 to-indigo-600",
      description: "Cultural and heritage experiences"
    },
    {
      name: "Party",
      icon: FaMusic,
      color: "from-pink-500 to-pink-600",
      description: "Fun and social trekking events"
    }
  ];

  // Team members data
  const teamMembers = [
    {
      name: "Chandu MR",
      role: "CEO & Co-Founder",
      image: "👨‍💼"
    },
    {
      name: "Varun H",
      role: "Sales Head & Co-Founder",
      image: "👨‍💼"
    },
    {
      name: "Suresh",
      role: "Finance & HR Head",
      image: "👨‍💼"
    },
    {
      name: "Karthik",
      role: "Operations Head",
      image: "👨‍💼"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-700 to-blue-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
              About Bengaluru Trekkers
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-emerald-100 max-w-3xl mx-auto leading-relaxed px-4">
              Connecting adventure enthusiasts with the world's most breathtaking trails since 2018
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-4 sm:space-x-4">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3">
                <span className="text-xl sm:text-2xl font-bold">500+</span>
                <p className="text-xs sm:text-sm">Treks Completed</p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3">
                <span className="text-xl sm:text-2xl font-bold">10K+</span>
                <p className="text-xs sm:text-sm">Happy Trekkers</p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3">
                <span className="text-xl sm:text-2xl font-bold">50+</span>
                <p className="text-xs sm:text-sm">Destinations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-start md:items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">Our Mission</h2>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-6 sm:mb-8">
              To create a safe, inclusive, and unforgettable trekking experience for everyone — whether you're a solo traveler or an adventure-seeking group.
              </p>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                  <span className="text-sm sm:text-base text-gray-700">Promote sustainable tourism practices</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                  <span className="text-sm sm:text-base text-gray-700">Support local communities and economies</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                  <span className="text-sm sm:text-base text-gray-700">Ensure safety and accessibility for all</span>
                </div>
              </div>
            </div>
            <div className="relative mt-8 md:mt-0">
              <div className="bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Our Vision</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                To go pan-India with unmatched safety standards, promote rural tourism, and help more people discover unexplored trails and responsible travel.
                </p>
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-emerald-500 rounded-full opacity-20"></div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 sm:w-16 sm:h-16 bg-blue-500 rounded-full opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Trek Categories Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-r from-gray-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">Explore Our Trek Categories</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Discover diverse trekking experiences tailored to every adventurer's preference
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {trekCategories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={index}
                  onClick={() => navigate(`/treks?category=${category.name.toLowerCase()}`)}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 p-4 sm:p-6 text-center border border-gray-100"
                >
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${category.color} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
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
          
          <div className="text-center mt-8 sm:mt-12">
            <button
              onClick={() => navigate('/treks')}
              className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors duration-300 text-sm sm:text-base"
            >
              <FaGlobe className="mr-2 h-4 w-4" />
              View All Treks
            </button>
          </div>
        </div>
      </section>

      {/* Founders' Story Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 sm:mb-16">
            <div className="flex items-center mb-6 sm:mb-8">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-600 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                <span className="text-white text-xs sm:text-sm">👣</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-emerald-700">Founders' Story</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-base sm:text-lg mb-6">
              Chandu MR and Varun H, co-founders of Bengaluru Trekkers, became friends in SJCE Engineering College through shared weekend trekking escapes. After graduation, while working in the same IT company in Bengaluru, their passion for trekking led Chandu to propose starting a trekking group to Varun, "not for business, just for people like us." Varun agreed, and they were later joined by college-mates Suresh and Karthik, forming a four-partner team built on trust, passion, and shared experience.
            </p>
            <div className="text-gray-400 text-xs sm:text-sm italic">Founders</div>
          </div>
          
          <div>
            <div className="flex items-center mb-6 sm:mb-8">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                <span className="text-white text-xs sm:text-sm">🚀</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-emerald-700">How It All Started</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-base sm:text-lg mb-6">
              Without a marketing budget, Chandu discovered a Twitter page called "Bangalore Roomie" (a hub for professionals in Bengaluru). He posted about their trek, tagged the page, and gained over 100 followers in one day. Their first trek to Bandaje Falls included 11 strangers from Twitter who became friends. The project scaled rapidly from one trek a month to multiple batches every weekend. By 2024, they formalized operations as TrekTales Explorers (OPC) Pvt. Ltd. under MCA, aiming to provide safe, inclusive, and quality trekking.
            </p>
            <p className="text-emerald-600 font-semibold text-base sm:text-lg">And it all started with one tweet.</p>
            <div className="text-gray-400 text-xs sm:text-sm italic mt-4">Twitter Post</div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Meet the Core Team</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl">{member.image}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Treks Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-r from-gray-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">Our Corporate Treks</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Successfully organized team building and corporate adventure experiences for leading companies
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {corporateTreks.map((trek, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 sm:p-6 border border-gray-100">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-lg sm:text-2xl">
                    {trek.logo}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{trek.company}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-3">{trek.description}</p>
                  <div className="bg-emerald-50 rounded-lg p-2 sm:p-3">
                    <p className="text-emerald-700 text-xs font-semibold">{trek.details}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🏔️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Adventure</h3>
              <p className="text-gray-600 leading-relaxed">
                We believe in the transformative power of adventure and exploration. 
                Every trek is an opportunity to discover new horizons and push personal boundaries.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🌱</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Sustainability</h3>
              <p className="text-gray-600 leading-relaxed">
                We are committed to protecting the natural environments we explore. 
                Our practices ensure minimal environmental impact and maximum preservation.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Community</h3>
              <p className="text-gray-600 leading-relaxed">
                We support local communities and promote cultural exchange. 
                Every trek contributes to the economic and social well-being of local populations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Ready for Your Next Adventure?</h2>
          <p className="text-lg sm:text-xl text-emerald-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of trekkers who have discovered the world's most beautiful trails with us.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button 
              onClick={() => navigate('/treks')}
              className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-lg transition-colors duration-300 text-sm sm:text-base"
            >
              Explore Treks
            </button>
            <button 
              onClick={() => navigate('/contact')}
              className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-lg transition-colors duration-300 text-sm sm:text-base"
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About; 