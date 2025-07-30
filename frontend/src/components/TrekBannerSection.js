import React from 'react';
import { Link } from 'react-router-dom';
import { FaTag, FaArrowRight, FaPercent, FaPlay } from 'react-icons/fa';

const TrekBannerSection = ({ banner }) => {
  if (!banner || banner.type !== 'banner') {
    return null;
  }

  const bannerStyle = {
    backgroundImage: `url(${banner.bannerImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  const overlayStyle = {
    backgroundColor: banner.overlayColor,
    opacity: banner.overlayOpacity,
  };

  const textStyle = {
    color: banner.textColor,
  };

  return (
    <div className="relative w-full h-44 md:h-58 lg:h-[300px] overflow-hidden rounded-2xl shadow-2xl transform hover:scale-[1.01] transition-all duration-500 group">
      {/* Background Image */}
      <div 
        className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-105"
        style={bannerStyle}
      />
      
      {/* Overlay */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={overlayStyle}
      />
      
      {/* Gradient Overlay for Better Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center items-center h-full px-6 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h2 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 md:mb-3 drop-shadow-2xl leading-tight" style={textStyle}>
            {banner.title}
          </h2>
          
          {/* Overlay Text */}
          <p className="text-base md:text-lg lg:text-xl xl:text-2xl mb-4 md:mb-6 leading-relaxed drop-shadow-lg max-w-3xl mx-auto" style={textStyle}>
            {banner.overlayText}
          </p>
          
          {/* Coupon Code and CTA Button Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            {/* Coupon Code */}
            {banner.couponCode && (
              <div className="flex items-center bg-white/20 backdrop-blur-md rounded-full px-3 md:px-4 py-1.5 md:py-2 border border-white/30 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <FaTag className="mr-1.5 md:mr-2 text-white text-sm md:text-base" />
                <span className="font-bold text-white text-xs md:text-sm">
                  Use Code: <span className="text-yellow-300 font-extrabold">{banner.couponCode}</span>
                </span>
              </div>
            )}
            
            {/* CTA Button - Only show if trek is linked */}
            {banner.linkToTrek && banner.linkToTrek.slug && (
              <Link
                to={`/treks/${banner.linkToTrek.slug}`}
                className="group inline-flex items-center bg-white text-gray-900 px-4 md:px-6 py-2 md:py-3 rounded-full font-bold text-sm md:text-base hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105"
              >
                <span>Explore Trek</span>
                <FaArrowRight className="ml-1.5 md:ml-2 group-hover:translate-x-2 transition-transform duration-300 text-base md:text-lg" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-8 left-8 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
        <div className="w-8 h-8 bg-white/20 rounded-full"></div>
      </div>
      
      <div className="absolute bottom-8 right-8 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
        <div className="w-6 h-6 bg-white/20 rounded-full"></div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse delay-500"></div>
      </div>
    </div>
  );
};

export default TrekBannerSection; 