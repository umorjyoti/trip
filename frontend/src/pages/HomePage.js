import React, { useState, useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import FeaturedTreks from '../components/FeaturedTreks';
import HomeTrekSections from '../components/HomeTrekSections';
import TestimonialsSection from '../components/TestimonialsSection';
import NewsletterSignup from '../components/NewsletterSignup';
import { Link } from 'react-router-dom';
import { FaTag, FaArrowRight } from 'react-icons/fa';
import { getActiveOffers, getAllTreks } from '../services/api';

function HomePage() {
  console.log('HomePage rendering');

  const [offersWithTreks, setOffersWithTreks] = useState([]);

  useEffect(() => {
    const fetchOffersWithTreks = async () => {
      try {
        console.log('Fetching offers...');
        const offers = await getActiveOffers();
        console.log('Active offers:', offers);
        
        console.log('Fetching all treks...');
        const allTreks = await getAllTreks();
        console.log('All treks:', allTreks);
        
        const offersData = offers.map(offer => {
          const trekIds = offer.applicableTreks.map(trek => trek._id || trek);
          console.log('Trek IDs for offer:', trekIds);
          
          const applicableTreks = allTreks.filter(trek => 
            trekIds.includes(trek._id)
          );
          console.log('Applicable treks for offer:', applicableTreks);
          
          return {
            ...offer,
            treks: applicableTreks
          };
        });
        
        const validOffers = offersData.filter(offer => offer.treks.length > 0);
        console.log('Valid offers with treks:', validOffers);
        setOffersWithTreks(validOffers);
      } catch (error) {
        console.error('Error fetching offers:', error);
      }
    };
    
    fetchOffersWithTreks();
  }, []);

  const renderOffersSection = () => {
    console.log('Rendering offers section, offersWithTreks:', offersWithTreks);
    
    if (offersWithTreks.length === 0) {
      console.log('No offers with treks to display');
      return null;
    }
    
    return (
      <section className="py-16 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold mb-3">
              Limited Time Offers
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Special Deals on Amazing Treks
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-gray-600">
              Book now and save on your next adventure with these exclusive offers
            </p>
          </div>
          
          <div className="space-y-12">
            {offersWithTreks.map((offer) => (
              <div key={offer._id} className="bg-white rounded-xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-orange-500 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">
                      {offer.name}
                    </h3>
                    <div className="bg-white text-amber-600 px-3 py-1 rounded-full font-bold text-sm">
                      {offer.discountType === 'percentage' 
                        ? `${offer.discountValue}% OFF` 
                        : `₹${offer.discountValue} OFF`}
                    </div>
                  </div>
                  <p className="text-amber-100 mt-1">
                    Valid until {new Date(offer.endDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="p-6">
                  {offer.description && (
                    <p className="text-gray-700 mb-6">{offer.description}</p>
                  )}
                  
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Featured Treks with this Offer:
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offer.treks.slice(0, 3).map((trek) => {
                      const originalPrice = trek.price || 0;
                      const discountedPrice = offer.discountType === 'percentage'
                        ? originalPrice - (originalPrice * offer.discountValue / 100)
                        : Math.max(0, originalPrice - offer.discountValue);
                      
                      return (
                        <Link 
                          key={trek._id} 
                          to={`/treks/${trek._id}`}
                          className="group block bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="aspect-w-16 aspect-h-9 overflow-hidden">
                            <img 
                              src={trek.imageUrl || 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'} 
                              alt={trek.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-4">
                            <h5 className="font-bold text-gray-900 mb-1 group-hover:text-amber-600 transition-colors">
                              {trek.name}
                            </h5>
                            <p className="text-sm text-gray-600 mb-2">
                              {trek.region}
                            </p>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-lg font-bold text-amber-600">
                                  ₹{Math.round(discountedPrice).toLocaleString('en-IN')}
                                </span>
                                <span className="ml-2 text-sm text-gray-500 line-through">
                                  ₹{Math.round(originalPrice).toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">
                                <FaTag className="inline mr-1" />
                                SAVE {offer.discountType === 'percentage' 
                                  ? `${offer.discountValue}%` 
                                  : `₹${offer.discountValue}`}
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  
                  {offer.treks.length > 3 && (
                    <div className="mt-6 text-center">
                      <Link 
                        to="/offers"
                        className="inline-flex items-center text-amber-600 font-medium hover:text-amber-700"
                      >
                        View all {offer.treks.length} treks with this offer
                        <FaArrowRight className="ml-2" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div>
      <HeroSection />
      {renderOffersSection()}
      <FeaturedTreks />
      <HomeTrekSections />
      <TestimonialsSection />
      <NewsletterSignup />
    </div>
  );
}

export default HomePage; 