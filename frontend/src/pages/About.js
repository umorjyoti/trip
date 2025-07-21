import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMountain,
  FaWater,
  FaUmbrellaBeach,
  FaHiking,
  FaGlassCheers,
  FaTheaterMasks,
  FaMusic,
  FaGlobe,
  FaCloudRain,
  FaSun,
  FaCalendarWeek,
} from "react-icons/fa";
import chanduImage from "../assets/chandu.png";
import sureshImage from "../assets/suresh.png";
import vraunImage from "../assets/vraun.png";
import karthikImage from "../assets/karthik.png";

function About() {
  const navigate = useNavigate();
  const [aboutSettings, setAboutSettings] = useState({
    stats: [],
    companyProfiles: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAboutSettings();
  }, []);

  const fetchAboutSettings = async () => {
    try {
      const response = await fetch('/settings/about-page');
      const data = await response.json();
      setAboutSettings(data.aboutPage || { stats: [], companyProfiles: [] });
    } catch (error) {
      console.error('Error fetching about page settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Corporate treks data - now using dynamic data from settings
  const corporateTreks = aboutSettings.companyProfiles || [];

  // Trek categories data
  const trekCategories = [
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

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
              Connecting adventure enthusiasts with the world's most
              breathtaking trails since 2022
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-4 sm:space-x-4">
              {!aboutSettings.stats || aboutSettings.stats.length === 0 ? (
                <div className="text-center">
                  <p className="text-emerald-100">Loading stats...</p>
                </div>
              ) : (
                aboutSettings.stats.filter(stat => stat.isActive).map((stat, index) => (
                                  <div key={index} className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3">
                    <span className="text-xl sm:text-2xl font-bold">{stat.value}</span>
                    <p className="text-xs sm:text-sm">{stat.label}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-start md:items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Our Mission
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-6 sm:mb-8">
                To create a safe, inclusive, and unforgettable trekking
                experience for everyone — whether you're a solo traveler or an
                adventure-seeking group.
              </p>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                  <span className="text-sm sm:text-base text-gray-700">
                    Promote sustainable tourism practices
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                  <span className="text-sm sm:text-base text-gray-700">
                    Support local communities and economies
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                  <span className="text-sm sm:text-base text-gray-700">
                    Ensure safety and accessibility for all
                  </span>
                </div>
              </div>
            </div>
            <div className="relative mt-8 md:mt-0">
              <div className="bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Our Vision
                </h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  To go pan-India with unmatched safety standards, promote rural
                  tourism, and help more people discover unexplored trails and
                  responsible travel.
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Explore Our Trek Categories
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Discover diverse trekking experiences tailored to every
              adventurer's preference
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {trekCategories.map((category, index) => {
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

          <div className="text-center mt-8 sm:mt-12">
            <button
              onClick={() => navigate("/treks")}
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
              <h2 className="text-2xl sm:text-3xl font-bold text-emerald-700">
                Founders' Story
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-base sm:text-lg mb-6">
              Chandu MR and Varun H, co-founders of Bengaluru Trekkers, became
              friends in SJCE Engineering College through shared weekend
              trekking escapes. After graduation, while working in the same IT
              company in Bengaluru, their passion for trekking led Chandu to
              propose starting a trekking group to Varun, "not for business,
              just for people like us." Varun agreed, and they were later joined
              by college-mates Suresh and Karthik, forming a four-partner team
              built on trust, passion, and shared experience.
            </p>
          </div>

          <div>
            <div className="flex items-center mb-6 sm:mb-8">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                <span className="text-white text-xs sm:text-sm">🚀</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-emerald-700">
                How It All Started
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-base sm:text-lg mb-6">
              Starting out with zero followers and no big marketing budget, the
              duo relied on creativity and community. While exploring growth
              ideas, Chandu stumbled upon a clever discovery — a Twitter page
              called Bangalore Roomie, popular among new residents of the city.
              The page reshared posts from users looking for roommates or
              flatmates and had a massive following of young, solo-working
              professionals new to Bengaluru — the very people who would love to
              go on treks! So, Chandu tweeted about their first trek, tagged
              @BangaloreRoomie, and it worked like magic. In one day, they
              gained over 100 followers, and inquiries started pouring in. Their
              first official trek was to Bandaje Falls, and 11 strangers joined
              — all of whom discovered the group through Twitter. That first
              experience was more than a trek — it was the beginning of a tribe.
              People came as strangers and returned as a bonded group, sharing
              memories, laughter, and mountain air. From then on: They ran treks
              across Karnataka, Kerala, and even Goa — all as a non-profit group
              for the first year. Treks quickly scaled to multiple batches every
              weekend, including corporate outings. The overwhelming response
              pushed them to formalize operations. In 2024, Bengaluru Trekkers
              became an official entity — TrekTales Explorers (OPC) Pvt. Ltd.,
              registered under MCA — so they could build a team, scale
              operations, and continue offering safe, high-quality, and
              inclusive trekking experiences.
            </p>
            <p className="text-emerald-600 font-semibold text-base sm:text-lg">
              And it all started with one tweet.
            </p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                Meet the Core Team
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-36 h-36 sm:w-48 sm:h-48 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 overflow-hidden">
                  {member.hasImage ? (
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-xl sm:text-2xl">{member.image}</span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Treks Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-r from-gray-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Our Corporate Treks
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Successfully organized team building and corporate adventure
              experiences for leading companies
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {corporateTreks.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No corporate treks available at the moment.</p>
              </div>
            ) : (
              corporateTreks.filter(company => company.isActive).map((trek, index) => (
                              <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 sm:p-6 border border-gray-100"
                >
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      {trek.logoImage ? (
                        <img
                          src={trek.logoImage}
                          alt={`${trek.company} logo`}
                          className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
                        />
                      ) : (
                        <span className="text-lg sm:text-2xl">{trek.logo}</span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {trek.company}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm mb-3">
                      {trek.description}
                    </p>
                    <div className="bg-emerald-50 rounded-lg p-2 sm:p-3">
                      <p className="text-emerald-700 text-xs font-semibold">
                        {trek.details}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🏔️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Adventure
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We believe in the transformative power of adventure and
                exploration. Every trek is an opportunity to discover new
                horizons and push personal boundaries.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🌱</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Sustainability
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We are committed to protecting the natural environments we
                explore. Our practices ensure minimal environmental impact and
                maximum preservation.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Community
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We support local communities and promote cultural exchange.
                Every trek contributes to the economic and social well-being of
                local populations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            Ready for Your Next Adventure?
          </h2>
          <p className="text-lg sm:text-xl text-emerald-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of trekkers who have discovered the world's most
            beautiful trails with us.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => navigate("/treks")}
              className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-lg transition-colors duration-300 text-sm sm:text-base"
            >
              Explore Treks
            </button>
            <button
              onClick={() => navigate("/contact")}
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
