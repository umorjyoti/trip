import React from 'react';
import { motion } from 'framer-motion';

const TermsConditions = () => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <motion.div 
            variants={itemVariants}
            className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-12 text-white"
          >
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>
              <p className="text-green-100 text-lg">Effective Date: {currentDate}</p>
            </div>
          </motion.div>

          {/* Content */}
          <div className="px-8 py-12">
            <motion.div variants={itemVariants} className="prose prose-lg max-w-none">
              
              {/* Introduction */}
              <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8 rounded-r-lg">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">General Terms & Conditions</h2>
                <p className="text-gray-700 leading-relaxed">
                  The Terms and Conditions define how a user interacts with our services and define the company's stand on the said usage of service. 
                  This document governs the relationship a customer has with our services. Upon acceptance, a user will by default be agreeing to all the clauses mentioned below.
                </p>
              </div>

              {/* Tour Price */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">1</span>
                    Tour Price
                  </h3>
                  <p className="text-gray-700">
                    The tour price may change depending on how many people join the trip.
                  </p>
                </div>
              </motion.div>

              {/* Accommodations */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">2</span>
                    Accommodations
                  </h3>
                  <p className="text-gray-700">
                    In some places, you won't find fancy hotels because they are in remote areas. So, don't expect things like 24/7 electricity, hot water, or Wi-Fi in these places.
                  </p>
                </div>
              </motion.div>

              {/* Room Categories */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">3</span>
                    Room Categories
                  </h3>
                  <p className="text-gray-700">
                    The tour packages are based on standard rooms, no matter what level of hotel you choose. If you want an upgrade, you'll have to pay at the hotel (as per availability).
                  </p>
                </div>
              </motion.div>

              {/* Similar Accommodation */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-pink-50 p-6 rounded-lg border-l-4 border-pink-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">4</span>
                    Similar Accommodation
                  </h3>
                  <p className="text-gray-700">
                    If you're travelling with a big group, we might not have enough rooms in one hotel. So, if we need to book two or more hotels, the rooms may not be exactly the same. We'll try our best to make them similar, but please be understanding.
                  </p>
                </div>
              </motion.div>

              {/* Special Requests */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">5</span>
                    Special Requests
                  </h3>
                  <p className="text-gray-700">
                    Any special requests, like early check-in or room preferences, depend on what's available when you arrive. If there are extra charges, you'll have to cover them.
                  </p>
                </div>
              </motion.div>

              {/* Meal Plans */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">6</span>
                    Meal Plans
                  </h3>
                  <p className="text-gray-700">
                    Meals are typically set menus or buffets, not à la carte. Snacks, drinks, soups, and desserts may not be included, and you'll need to pay separately for those (as per availability).
                  </p>
                </div>
              </motion.div>

              {/* Alcohol */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">7</span>
                    Alcohol
                  </h3>
                  <p className="text-gray-700">
                    Although we do not promote the consumption of Alcohol at high-altitude areas, if you want to have alcohol in hotels or rooms, you'll need to follow the hotel's rules.
                  </p>
                </div>
              </motion.div>

              {/* Triple Sharing Rooms */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-teal-50 p-6 rounded-lg border-l-4 border-teal-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">8</span>
                    Triple Sharing Rooms
                  </h3>
                  <p className="text-gray-700">
                    In triple-sharing rooms, we provide an extra mattress, not a full extra bed.
                  </p>
                </div>
              </motion.div>

              {/* Water and Electricity */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-cyan-50 p-6 rounded-lg border-l-4 border-cyan-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">9</span>
                    Water and Electricity
                  </h3>
                  <p className="text-gray-700">
                    In hilly areas, there may be limited water and electricity. Some hotels have fixed schedules for hot and cold water. We're sorry for any inconvenience, and we appreciate your cooperation.
                  </p>
                </div>
              </motion.div>

              {/* ID Requirement */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-lime-50 p-6 rounded-lg border-l-4 border-lime-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-lime-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">10</span>
                    ID Requirement
                  </h3>
                  <p className="text-gray-700">
                    The government requires all guests to show a valid photo ID when checking in at hotels thus it is mandatory for all guests to submit their IDs in the forms shared by their POCs/Sales Agents for hassle-free check-in.
                  </p>
                </div>
              </motion.div>

              {/* Camp Accommodations */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-emerald-50 p-6 rounded-lg border-l-4 border-emerald-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">11</span>
                    Camp Accommodations
                  </h3>
                  <p className="text-gray-700">
                    Camps in places like Sarchu, Nubra, Pangong, Jispa, Chandratal, etc., are very basic, even though they have different categories. Although the Swiss Camps have attached bathroom facilities, running hot water and electricity are not available due to the remoteness of these locations. Thus, we appreciate your cooperation and understanding as an adventure traveler in the same.
                  </p>
                </div>
              </motion.div>

              {/* Possible Delays */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-amber-50 p-6 rounded-lg border-l-4 border-amber-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">12</span>
                    Possible Delays
                  </h3>
                  <p className="text-gray-700">
                    Sometimes, due to unforeseen events like traffic, strikes, or other reasons, the vehicle may be delayed. Please be patient and board the vehicle as soon as it arrives to avoid further delays.
                  </p>
                </div>
              </motion.div>

              {/* Vehicle Usage */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-rose-50 p-6 rounded-lg border-l-4 border-rose-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">13</span>
                    Vehicle Usage
                  </h3>
                  <p className="text-gray-700">
                    The vehicle is only for the planned itinerary and not for your personal use.
                  </p>
                </div>
              </motion.div>

              {/* No AC in Hilly Regions */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-sky-50 p-6 rounded-lg border-l-4 border-sky-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-sky-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">14</span>
                    No AC in Hilly Regions
                  </h3>
                  <p className="text-gray-700">
                    In hilly areas, vehicles like Tempo Traveler, Innova, Xylo, Scorpio, or similar won't have air conditioning.
                  </p>
                </div>
              </motion.div>

              {/* Volvo Bus */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-violet-50 p-6 rounded-lg border-l-4 border-violet-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-violet-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">15</span>
                    Volvo Bus
                  </h3>
                  <p className="text-gray-700">
                    The Volvo bus from Delhi to the starting point of the tour is provided by a third party. While we arrange a replacement in case of a breakdown, it might take some time.
                  </p>
                </div>
              </motion.div>

              {/* Lunch/Dinner Stops */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-fuchsia-50 p-6 rounded-lg border-l-4 border-fuchsia-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-fuchsia-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">16</span>
                    Lunch/Dinner Stops
                  </h3>
                  <p className="text-gray-700">
                    The Volvo bus stops for lunch and dinner at predefined places chosen by the vendor and not by us.
                  </p>
                </div>
              </motion.div>

              {/* Tour Program */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-slate-50 p-6 rounded-lg border-l-4 border-slate-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-slate-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">17</span>
                    Tour Program
                  </h3>
                  <p className="text-gray-700">
                    Please follow the tour program as closely as possible. We can't provide refunds if you don't join the group on time or if you leave early.
                  </p>
                </div>
              </motion.div>

              {/* Discontinuation */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-zinc-50 p-6 rounded-lg border-l-4 border-zinc-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-zinc-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">18</span>
                    Discontinuation
                  </h3>
                  <p className="text-gray-700">
                    If you have to leave the tour for reasons like illness or loss of travel documents, we can't refund unused services.
                  </p>
                </div>
              </motion.div>

              {/* Pre-Tour Services */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-neutral-50 p-6 rounded-lg border-l-4 border-neutral-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-neutral-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">19</span>
                    Pre-Tour Services
                  </h3>
                  <p className="text-gray-700">
                    If you use pre-tour services but then don't join the main tour, there won't be any refund for unused services.
                  </p>
                </div>
              </motion.div>

              {/* Behavior */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-stone-50 p-6 rounded-lg border-l-4 border-stone-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-stone-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">20</span>
                    Behavior
                  </h3>
                  <p className="text-gray-700">
                    We reserve the right to remove anyone from the tour if their behavior disrupts the experience for others.
                  </p>
                </div>
              </motion.div>

              {/* Liabilities */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gray-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">21</span>
                    Liabilities
                  </h3>
                  <p className="text-gray-700">
                    Our immunities extend to our employees, directors, managers, and agents, but not to independent contractors.
                  </p>
                </div>
              </motion.div>

              {/* Severability */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">22</span>
                    Severability
                  </h3>
                  <p className="text-gray-700">
                    If one condition is invalid, the others still apply. We're not liable for more than the total amount you paid for the tour.
                  </p>
                </div>
              </motion.div>

              {/* Price Changes */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">23</span>
                    Price Changes
                  </h3>
                  <p className="text-gray-700">
                    Prices may change due to factors like fuel costs or airline/rail charges. You'll need to pay for any increases before departure.
                  </p>
                </div>
              </motion.div>

              {/* Time Limits */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">24</span>
                    Time Limits
                  </h3>
                  <p className="text-gray-700">
                    If you have any issues with the tour, you must bring a legal claim within 10 days after the tour ends.
                  </p>
                </div>
              </motion.div>

              {/* Booking through Agents */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">25</span>
                    Booking through Agents
                  </h3>
                  <p className="text-gray-700">
                    If you book through a travel agent, your contract is with them, and we're just a supplier.
                  </p>
                </div>
              </motion.div>

              {/* Scheme Changes */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">26</span>
                    Scheme Changes
                  </h3>
                  <p className="text-gray-700">
                    We can change or withdraw any discount or offer at any time unless we specifically state otherwise.
                  </p>
                </div>
              </motion.div>

              {/* Important Notice */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">⚠️ Important Notice</h3>
                  <p className="text-gray-700 font-medium">
                    By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions. 
                    These terms constitute a legally binding agreement between you and TrekTales Explorers (OPC) Private Limited.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div 
            variants={itemVariants}
            className="bg-gray-50 px-8 py-6 border-t border-gray-200"
          >
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Last updated: {currentDate} | TrekTales Explorers (OPC) Private Limited
              </p>
              <p className="text-gray-500 text-xs mt-2">
                For questions about these terms, please contact us at{' '}
                <a href="mailto:support@bengalurutrekkers.in" className="text-blue-600 hover:text-blue-800 underline">
                  support@bengalurutrekkers.in
                </a>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsConditions; 