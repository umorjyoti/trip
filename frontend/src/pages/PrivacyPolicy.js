import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
            className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-12 text-white"
          >
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-blue-100 text-lg">Effective Date: {currentDate}</p>
            </div>
          </motion.div>

          {/* Content */}
          <div className="px-8 py-12">
            <motion.div variants={itemVariants} className="prose prose-lg max-w-none">
              
              {/* Welcome Note */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome Note</h2>
                <p className="text-gray-700 leading-relaxed">
                  Welcome to TrekTales Explorers (OPC) Private Limited, also known as Bengaluru Trekkers, 
                  located at <a href="https://bengalurutrekkers.in" className="text-blue-600 hover:text-blue-800 underline">https://bengalurutrekkers.in</a>. 
                  We are committed to protecting the privacy and security of our trekkers, travelers, and website/app users. 
                  This Privacy Policy provides detailed information on how we collect, use, process, and protect your personal information.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  This Privacy Policy applies to any person ("User") who purchases, intends to purchase, or inquires about 
                  any product(s) or service(s) offered by TrekTales Explorers through any of its digital platforms, 
                  including its website and mobile site.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  By accessing or using our platforms, you agree to the terms outlined in this Privacy Policy. 
                  If you do not agree with this policy, we kindly request you not to access or use our platforms.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  This policy does not apply to third-party websites/apps that may be linked from our website. 
                  We recommend reviewing their respective privacy statements before interacting with those platforms.
                </p>
              </div>

              {/* Section 1: Information We Collect */}
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
                  Information We Collect
                </h2>
                <p className="text-gray-700 mb-6">
                  We collect information necessary to provide you with our services and improve your experience. This may include:
                </p>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">a) Personal Identification Information:</h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>Name, email, contact number, address</li>
                      <li>Emergency contact details</li>
                      <li>Age and gender</li>
                      <li>Identity documents (if required for permits or travel insurance)</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">b) Travel Details:</h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>Trek or trip preferences</li>
                      <li>Travel dates</li>
                      <li>Accommodation and food preferences</li>
                      <li>Medical conditions (disclosed voluntarily)</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">c) Payment Information:</h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>UPI, card or net banking details (processed via secure gateways)</li>
                      <li>We do not store sensitive payment information</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">d) Technical and Usage Information:</h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>IP address, browser type, device model, OS, referral URL</li>
                      <li>Session activity and website interaction</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">e) Legal ID (specific cases):</h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>PAN or Passport number for government/permit compliance only</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Section 2: How We Use Your Information */}
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
                  How We Use Your Information
                </h2>
                <div className="bg-green-50 p-6 rounded-lg">
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Confirm and manage bookings</li>
                    <li>Communicate logistics and safety information</li>
                    <li>Personalize your experience</li>
                    <li>Improve services and website</li>
                    <li>Send promotional content (if opted-in)</li>
                    <li>Comply with legal and regulatory requirements</li>
                  </ul>
                </div>
              </motion.div>

              {/* Section 3: Sharing and Disclosure */}
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">3</span>
                  Sharing and Disclosure of Information
                </h2>
                <div className="bg-yellow-50 p-6 rounded-lg">
                  <p className="text-gray-700 mb-4 font-semibold">
                    We do not sell or rent your personal information.
                  </p>
                  <p className="text-gray-700 mb-4">
                    We may share information with:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li>Service Providers (transport, homestays, guides, payment gateways)</li>
                    <li>Legal Authorities (when required)</li>
                    <li>Permit/Insurance agencies (for compliance)</li>
                  </ul>
                  <p className="text-gray-700 mt-4">
                    Third parties act independently; we recommend reviewing their privacy policies.
                  </p>
                </div>
              </motion.div>

              {/* Section 4: Data Security */}
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">4</span>
                  Data Security
                </h2>
                <div className="bg-red-50 p-6 rounded-lg">
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>We use industry-standard encryption and access control measures.</li>
                    <li>No system is 100% secure. Users are advised to protect account credentials and avoid sharing sensitive info on open platforms.</li>
                  </ul>
                </div>
              </motion.div>

              {/* Section 5: International Transfers */}
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">5</span>
                  International Transfers
                </h2>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <p className="text-gray-700">
                    Your data may be transferred to servers outside your state or country. 
                    We handle all such transfers according to this policy.
                  </p>
                </div>
              </motion.div>

              {/* Section 6: Your Rights */}
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">6</span>
                  Your Rights
                </h2>
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <p className="text-gray-700 mb-4">You may:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li>Access or correct your data</li>
                    <li>Request deletion (where legal)</li>
                    <li>Withdraw consent for communications</li>
                  </ul>
                  <p className="text-gray-700 mt-4">
                    Contact: <a href="mailto:privacy@bengalurutrekkers.in" className="text-blue-600 hover:text-blue-800 underline">privacy@bengalurutrekkers.in</a>
                  </p>
                </div>
              </motion.div>

              {/* Section 7: Cookies */}
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">7</span>
                  Cookies and Tracking Technologies
                </h2>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <p className="text-gray-700 mb-4">We use cookies to:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li>Analyze behavior</li>
                    <li>Improve website performance</li>
                  </ul>
                  <p className="text-gray-700 mt-4">
                    You may disable cookies via browser settings, though some features may not function optimally.
                  </p>
                </div>
              </motion.div>

              {/* Section 8: Changes to Policy */}
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">8</span>
                  Changes to This Privacy Policy
                </h2>
                <div className="bg-teal-50 p-6 rounded-lg">
                  <p className="text-gray-700">
                    We may update this policy. Any changes will be posted here with a revised "Effective Date".
                  </p>
                </div>
              </motion.div>

              {/* Section 9: Contact Us */}
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">9</span>
                  Contact Us
                </h2>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <p className="text-gray-700 mb-4">For questions or concerns, contact us at:</p>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      📧 <a href="mailto:privacy@bengalurutrekkers.in" className="text-blue-600 hover:text-blue-800 underline">privacy@bengalurutrekkers.in</a>
                    </p>
                    <p className="text-gray-700">
                      🌐 <a href="https://bengalurutrekkers.in" className="text-blue-600 hover:text-blue-800 underline">https://bengalurutrekkers.in</a>
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Section 10: Media Consent */}
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">10</span>
                  Media Consent
                </h2>
                <div className="bg-pink-50 p-6 rounded-lg">
                  <p className="text-gray-700 mb-4">
                    By participating in any trek, trip, or event organized by TrekTales Explorers (Bengaluru Trekkers), 
                    you grant us the right to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                    <li>Capture photos and videos that may include your image or voice</li>
                    <li>Use this content for promotion on social media, website, or ads</li>
                  </ul>
                  <p className="text-gray-700 mb-4">
                    This content may be used without compensation or notice, solely for marketing and community purposes.
                  </p>
                  <p className="text-gray-700 font-semibold">
                    If you do not wish to appear in media, please inform the trek lead before the trek begins.
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
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 