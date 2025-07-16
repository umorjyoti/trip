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
              <h1 className="text-4xl font-bold mb-4">TrekTales Explorers (OPC) Pvt. Ltd. – Terms & Conditions</h1>
              <p className="text-green-100 text-lg">Effective Date: {currentDate}</p>
            </div>
          </motion.div>

          {/* Content */}
          <div className="px-8 py-12">
            <motion.div variants={itemVariants} className="prose prose-lg max-w-none">
              
              {/* Introduction */}
              <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8 rounded-r-lg">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">GENERAL POLICIES</h2>
                <p className="text-gray-700 leading-relaxed">
                  These Terms and Conditions govern the relationship between the customer and TrekTales Explorers
                  (OPC) Pvt. Ltd. (hereafter referred to as "we" or "our"). By using our services or joining any of our treks
                  or tours, the user agrees to abide by these policies.
                </p>
              </div>

              {/* General Policies */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">General Policies</h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>• Tour Price: Subject to change based on number of participants.</li>
                    <li>• Accommodations: Provided in base-category rooms. Expect basic amenities in remote/offbeat areas; luxury options are not guaranteed.</li>
                    <li>• Room Upgrades: Available only upon request and at additional cost (subject to availability).</li>
                    <li>• Special Requests: Subject to availability on arrival. Additional charges applicable.</li>
                    <li>• Meal Plans: Based on fixed menus/buffets. Items like snacks, drinks, desserts are not included.</li>
                    <li>• Alcohol Consumption: Not encouraged during high-altitude treks. Subject to accommodation policies.</li>
                    <li>• Triple Sharing Rooms: Provided with an extra mattress (not an extra bed).</li>
                    <li>• Water & Electricity Scarcity: Common in hilly regions; cooperate with limited resources.</li>
                    <li>• ID Requirement: Mandatory government photo ID for hotel check-in.</li>
                    <li>• Camp Accommodation: Basic in remote areas like Pangong, Sarchu, etc.</li>
                    <li>• Vehicle Delays: Possible due to unforeseen events. Cooperation expected.</li>
                    <li>• Vehicle Use: Restricted to itinerary. No personal use allowed.</li>
                    <li>• No AC: Not available in vehicles like Tempo Traveler, Innova, etc., in hilly areas.</li>
                    <li>• Volvo Travel: Operated by third-party vendors. We'll arrange replacements in case of breakdowns.</li>
                    <li>• Lunch/Dinner Stops: As per pre-defined vendor locations.</li>
                    <li>• Discontinuation: No refund if user discontinues tour voluntarily.</li>
                    <li>• Behavior Policy: Participants disturbing the group may be removed without refund.</li>
                    <li>• Legal Claims: Must be raised within 10 days after trip completion.</li>
                  </ul>
                </div>
              </motion.div>

              {/* Liability */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Liability</h3>
                  <p className="text-gray-700 mb-4">
                    If the company decides to make changes to your booked tour or holiday after you've already made your
                    plans, here's what you can do:
                  </p>
                  <ul className="text-gray-700 space-y-2 mb-4">
                    <li>• You can go along with the altered tour or holiday plans.</li>
                    <li>• Alternatively, you can opt for a different tour or holiday that the company suggests.</li>
                  </ul>
                  <p className="text-gray-700 mb-4">
                    In either of these cases, you won't be able to claim any compensation for damages, extra expenses, or
                    any other losses. If, for some reason, the company can't run a particular tour, they may refund your tour
                    cost, minus their actual expenses related to your booking. You can't raise any concerns about this
                    afterward.
                  </p>
                  <p className="text-gray-700 mb-4">The company won't be responsible for:</p>
                  <ul className="text-gray-700 space-y-2">
                    <li>• Any harm or accidents during your trip, whether it's due to illness, injury, delays, discomfort, theft, or any other reason.</li>
                    <li>• Loss or damage to your baggage or personal belongings, even if it happens because of someone's negligence.</li>
                    <li>• Issues like airlines overbooking, flight cancellations, or route changes. If you can't board your flight due to such circumstances, the company won't be liable, and you can't claim a refund or compensation.</li>
                    <li>• If events beyond the company's control (like force majeure) affect your trip, they won't be held responsible for any resulting damages.</li>
                  </ul>
                </div>
              </motion.div>

              {/* Brochure Accuracy */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Brochure Accuracy</h3>
                  <p className="text-gray-700">
                    We're in the business of organizing travel and holidays, not running airlines, hotels, transport services,
                    or any other facilities mentioned in our brochure. While we carefully select all the components of your
                    holiday, we can't control the actions or defaults of the management or employees of these independent
                    contractors. If any issues arise due to their actions, we can't take responsibility for them.
                  </p>
                </div>
              </motion.div>

              {/* Scope of Activity */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-pink-50 p-6 rounded-lg border-l-4 border-pink-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Scope of Activity</h3>
                  <p className="text-gray-700">
                    If your actions during our services cause damage or loss to our vendors or service providers (like
                    airlines, hotels, and transport services), you agree to indemnify and hold us harmless from any claims.
                  </p>
                </div>
              </motion.div>

              {/* Other Terms & Conditions */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Other Terms & Conditions</h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>• To finalize your booking with us, we require the initial deposit per person as specified for each tour package. Full payment must be received according to our payment terms. Failure to do so may lead to cancellation with a loss of deposit and applicable cancellation charges.</li>
                    <li>• By accepting our Terms & Conditions, you agree to receive all transactional messages regarding your booking via WhatsApp, email, and SMS from TrekTales Explorers (Bengaluru Trekkers).</li>
                    <li>• If your trip includes Adventure Travel Insurance provided by us or if you voluntarily opt for this insurance, you agree to provide accurate details required in the form shared by our team. Incorrect or incomplete information can lead to rejection of claims, and TrekTales Explorers (Bengaluru Trekkers) will not be responsible for any denial of claims due to incorrect details provided. Kindly double-check all your information before submitting.</li>
                    <li>• If you choose to voluntarily discontinue your trip once it has started, you must submit a written form to the Trip/Trek Leader. The final decision regarding your discontinuation request will be made by our ground operations team at that moment. No refunds will be processed in these scenarios, and you acknowledge that all liabilities following the submission of this form are solely yours, and TrekTales Explorers (Bengaluru Trekkers) will not be held responsible.</li>
                    <li>• We reserve the right to terminate the contract before the tour begins, with a refund of the initial deposit but no interest. Make changes, substitutions, or withdrawals to any tour, holiday, excursion, or facility advertised. In these cases, we won't be liable for any resulting damages, expenses, or compensation claims. No one except us, in writing, can change the terms and conditions mentioned in this brochure.</li>
                  </ul>
                </div>
              </motion.div>

              {/* Health & Safety */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Health & Safety</h3>
                  <p className="text-gray-700 mb-4">We won't be liable for:</p>
                  <ul className="text-gray-700 space-y-2 mb-4">
                    <li>• Any harm, injury, sickness, accidents, delays, discomfort, or misadventures during your trip.</li>
                    <li>• Acts, omissions, defaults of independent contractors, their employees, servants, or agents engaged in providing services during your trip, even if they are negligent.</li>
                    <li>• Loss or damage to baggage or personal effects, even if it's due to negligence.</li>
                  </ul>
                  <p className="text-gray-700 mb-4">
                    Our liability for any claims related to the tour or holiday, including any consequential losses or
                    expenses, is limited to the total amount paid for the tour.
                  </p>
                  <p className="text-gray-700 mb-4">
                    If you have any complaints about our independent contractors' services, you must inform them in
                    writing and provide a copy to our tour manager so that we can address the issue for the benefit of
                    future clients.
                  </p>
                  <p className="text-gray-700 mb-4">
                    Any claims or complaints must be submitted to us in writing within 10 days after the end of your holiday
                    tour. Claims beyond this period won't be entertained.
                  </p>
                  <p className="text-gray-700">
                    Each condition mentioned here stands independently. If any provision is invalid, illegal, or
                    unenforceable, the remaining provisions will still apply.
                  </p>
                </div>
              </motion.div>

              {/* Force Majeure */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Force Majeure</h3>
                  <p className="text-gray-700 mb-4">
                    In cases of acts of God, adverse weather, earthquakes, fires, war, invasions, rebellions, strikes,
                    government actions, or other unforeseen events that force us to make changes or incur additional
                    expenses, passengers will be responsible for these extra costs.
                  </p>
                  <ul className="text-gray-700 space-y-2">
                    <li>• Special Needs: If you have any special needs, let us know when you book. We'll try to help, but sometimes we can't do it all.</li>
                    <li>• No Smoking: Don't light up on our vehicles during the trip, and follow the local smoking rules when we're out and about.</li>
                    <li>• Our Best Effort: We do our best to give you great service, but we don't own the restaurants or hotels. So, if something's not up to snuff, we can't take the blame.</li>
                    <li>• Follow the Rules: Obey local laws and traffic rules. And if our tour manager makes a call for the group's safety, listen up. If you don't, you might have to find your own way home.</li>
                    <li>• Luggage Rules: Leave the illegal stuff at home. We don't want anything that could get us or you in trouble.</li>
                    <li>• Safety First: Your safety is super important to us. If we think it's not safe for you to ride, we'll have you finish the trip in the support vehicle. Sorry, no refunds in that case.</li>
                    <li>• No Booze or Drugs: Don't drink or do drugs before or during the ride. It's just not cool. We can boot you from the tour if you do.</li>
                    <li>• We Can Say No: We can choose who comes along on our trips. If your behavior isn't cool, we can ask you to leave, and you'll have to sort yourself out.</li>
                    <li>• Your Responsibility: Finally, you're in charge of your safety and your passenger's (if you have one). We're not responsible for any mishaps.</li>
                  </ul>
                </div>
              </motion.div>

              {/* PAYMENT POLICIES */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-teal-50 p-6 rounded-lg border-l-4 border-teal-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">PAYMENT POLICIES</h3>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Payment Structure Details</h4>
                  <ul className="text-gray-700 space-y-2 mb-4">
                    <li>• <strong>Booking Amount:</strong> Fixed advance (non-refundable) as defined per trip</li>
                    <li>• <strong>Final Payment:</strong> Due before departure</li>
                    <li>• <strong>Modes Accepted:</strong> UPI, Net Banking, Cards, QR Payment, Payment Gateway</li>
                  </ul>
                  <ul className="text-gray-700 space-y-2">
                    <li>• You agree to receive communication via SMS, WhatsApp, and Email.</li>
                    <li>• Failure to pay on time may result in cancellation of your booking.</li>
                  </ul>
                </div>
              </motion.div>

              {/* CANCELLATION POLICY */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-cyan-50 p-6 rounded-lg border-l-4 border-cyan-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">CANCELLATION POLICY</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-left">Policy</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Up to 21 Days</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">20–15 Days</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">14–8 Days</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">7–0 Days</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-semibold">Batch Shifting</td>
                          <td className="border border-gray-300 px-4 py-2 text-green-600">✅ Free Batch Shifting</td>
                          <td className="border border-gray-300 px-4 py-2 text-red-600">❌ Not Available</td>
                          <td className="border border-gray-300 px-4 py-2 text-red-600">❌ Not Available</td>
                          <td className="border border-gray-300 px-4 py-2 text-red-600">❌ Not Available</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-semibold">Cancellation Charge</td>
                          <td className="border border-gray-300 px-4 py-2">Free Cancellation</td>
                          <td className="border border-gray-300 px-4 py-2">25% of the Trip Amount</td>
                          <td className="border border-gray-300 px-4 py-2">50% of the Trip Amount</td>
                          <td className="border border-gray-300 px-4 py-2">100% of the Trip Amount</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-semibold">Booking Amount</td>
                          <td className="border border-gray-300 px-4 py-2">Refunded in mode of original payment</td>
                          <td className="border border-gray-300 px-4 py-2">Adjusted in Refund Deduction</td>
                          <td className="border border-gray-300 px-4 py-2">Adjusted in Refund Deduction</td>
                          <td className="border border-gray-300 px-4 py-2">No Refund</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-semibold">Remaining Amount</td>
                          <td className="border border-gray-300 px-4 py-2">Full Refund (minus booking amount)</td>
                          <td className="border border-gray-300 px-4 py-2">Refund (minus 25% of the trip amount)</td>
                          <td className="border border-gray-300 px-4 py-2">Refund (minus 50% of the trip amount)</td>
                          <td className="border border-gray-300 px-4 py-2">No Refund</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <ul className="text-gray-700 space-y-2 mt-4">
                    <li>• Booking amount is non-refundable.</li>
                    <li>• Refund is calculated on total trip amount, not just remaining payment.</li>
                    <li>• Credit notes (if any) issued are transferable and have lifetime validity.</li>
                  </ul>
                </div>
              </motion.div>

              {/* Company-Initiated Cancellation */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-lime-50 p-6 rounded-lg border-l-4 border-lime-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Company-Initiated Cancellation</h3>
                  <p className="text-gray-700 mb-4">
                    If TrekTales Explorers cancels due to operational/safety/low bookings:
                  </p>
                  <ul className="text-gray-700 space-y-2 mb-4">
                    <li>• You may opt for full refund or batch shift.</li>
                    <li>• Refund Terms (excluding booking amount):</li>
                  </ul>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-left">Time Before Departure</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Refund Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">0 – 14 Days</td>
                          <td className="border border-gray-300 px-4 py-2">Full credit note</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">15 – 29 Days</td>
                          <td className="border border-gray-300 px-4 py-2">50% refund, 50% credit note</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">30+ Days</td>
                          <td className="border border-gray-300 px-4 py-2">Full refund to original payment source</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>

              {/* BYPASS POLICY / FORCE MAJEURE */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-emerald-50 p-6 rounded-lg border-l-4 border-emerald-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">BYPASS POLICY / FORCE MAJEURE</h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>• In events like war, pandemic, protests, natural calamities, force majeure etc., refunds or alternatives will be governed under this policy.</li>
                    <li>• Extra costs due to such circumstances will be borne by the customer.</li>
                  </ul>
                </div>
              </motion.div>

              {/* OTHER POLICIES */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-amber-50 p-6 rounded-lg border-l-4 border-amber-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">OTHER POLICIES</h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>• <strong>Media Consent:</strong> By joining our trip, you consent to usage of photos/videos taken during the trip for promotional purposes on social media and other platforms.</li>
                    <li>• <strong>Health & Safety:</strong> Trek at your own risk. Ensure you're medically fit. TrekTales is not liable for injury, loss, illness, or accidents.</li>
                    <li>• <strong>Credit Notes:</strong> Lifetime validity. Can't be used for booking amount. Can be transferred for other trips (conditions apply).</li>
                    <li>• <strong>Amendments/Modifications:</strong> TrekTales reserves the right to change any policy, trip structure, itinerary, price or schedule.</li>
                    <li>• <strong>Jurisdiction:</strong> All disputes and legal matters must be resolved under the jurisdiction of Bengaluru courts only.</li>
                    <li>• <strong>Complaints:</strong> Must be raised in writing within 10 days after tour end.</li>
                    <li>• <strong>Proprietary Rights:</strong> Content on our website or documents is protected by copyright.</li>
                    <li>• <strong>Liability Disclaimer:</strong> TrekTales is not responsible for third-party errors (hotels, airlines, transport) or any delay, theft, injury or loss.</li>
                  </ul>
                </div>
              </motion.div>

              {/* Things to Keep in Mind */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-rose-50 p-6 rounded-lg border-l-4 border-rose-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Things to Keep in Mind</h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>• Tour price is subject to change as per the occupancy on the tour.</li>
                    <li>• Some regions do not have star category hotels due to their offbeat locations thus we'd expect you to not expect luxurious amenities and at times, even basic amenities like 24x7 running electricity, hot water & wifi at these properties/hotels/homestays.</li>
                    <li>• Packages are based on base category rooms, irrespective of the hotel category opted.</li>
                    <li>• Room up-gradation payable at the hotel directly. For large groups, all rooms in one hotel may not be available, so if two or more hotels are selected, identical facilities may not be available between rooms. We will however try our best to maintain similarities in services but we expect you to adjust to these conditions.</li>
                    <li>• Please note that all special requests like early check-in, views, smoking, non smoking, floors, king, twin, adjoining and/or interconnecting rooms are strictly subject to availability upon arrival and cannot be guaranteed prior. Any expenses arising out of this is to be borne by the customer.</li>
                    <li>• For meal plans, the menu will be on fixed plan/ buffet basis and not on A-la-Carte basis. MAP plans do not include evening snacks and cold drinks / liquor, soups or desserts. For order on A-la Carte basis, guests are requested to make direct payment for additional items.</li>
                    <li>• Consumption and serving of alcohol in hotels / rooms is subject to hotel's rules and regulations.</li>
                    <li>• In triple sharing room, an extra mattress is provided. This is not to be confused with an extra bed.</li>
                    <li>• In hilly areas, scarcity of water and electricity is a natural phenomenon. To overcome the water crisis, certain hotels have fixed schedule for supplying hot and cold water. We strongly regret the inconvenience but do look forward to your cooperation.</li>
                    <li>• As imposed by the Government, a valid photo ID for all members staying at the hotel is mandatory.</li>
                    <li>• The camp accommodations at various places especially like Sarchu, Nubra and Pangong, Chandratal etc. are very basic even though they are classified into various categories.</li>
                    <li>• Due to unforeseen situations (force majeure/ traffic jams / traffic halts/ diversions/ curfew, Union strike, VVIP movement, etc.) the vehicle reporting may get delayed and in such case, we request you to bear with us. We also expect you to board the vehicle as soon as it arrives so any further delay can be avoided.</li>
                    <li>• The vehicle used will not be at disposal and will be exclusively used as per the itinerary only (on point to point basis).</li>
                    <li>• No AC will be available in vehicles like Tempo Traveler/ Innova / Xylo / Scorpio or any similar category in hilly regions.</li>
                    <li>• Kindly note that the transport to Base is a third party vehicle provided by our listed vendors. Please understand that these are regular running vehicles and we cannot keep a proper check on them although in case of a break down a new vehicle is arranged but at times it takes a little while for the on-ground operations to do so thus, your cooperation if any breakdown happens is required.</li>
                    <li>• The bus halts for lunch/dinner wherever required are predefined by the vendor and cannot be changed by us as per our convenience.</li>
                  </ul>
                </div>
              </motion.div>

              {/* Final Note */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-l-4 border-green-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Final Note</h3>
                  <p className="text-gray-700">
                    Tour prices are dynamic, and early bookers may get lower prices, while last-minute bookings may cost
                    more. Prices in the brochure are based on prevailing rates at the time of printing and may change
                    before departure, with any increases to be paid in full before your trip.
                  </p>
                </div>
              </motion.div>

            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsConditions; 