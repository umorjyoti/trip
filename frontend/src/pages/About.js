import React from 'react';

function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">About TrekBooker</h1>
        
        <div className="prose prose-emerald max-w-none">
          <p className="text-lg text-gray-700 mb-6">
            TrekBooker is your ultimate companion for discovering and booking unforgettable trekking adventures around the world.
          </p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-6">
            Our mission is to connect adventure enthusiasts with the most breathtaking trekking experiences while promoting sustainable tourism and supporting local communities.
          </p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Story</h2>
          <p className="text-gray-700 mb-6">
            Founded by a group of passionate trekkers, TrekBooker was born from the desire to simplify the process of finding and booking quality trekking experiences. We understand the challenges of planning adventure trips, from finding reliable guides to ensuring safety and environmental responsibility.
          </p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What We Offer</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-6">
            <li>Carefully curated trekking experiences across various difficulty levels</li>
            <li>Detailed information about each trek, including duration, difficulty, and highlights</li>
            <li>Secure and easy booking process</li>
            <li>Support from experienced trekking experts</li>
            <li>Commitment to sustainable and responsible tourism</li>
          </ul>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-emerald-700 mb-2">Adventure</h3>
              <p className="text-gray-700">We believe in the transformative power of adventure and exploration.</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-emerald-700 mb-2">Sustainability</h3>
              <p className="text-gray-700">We are committed to protecting the natural environments we explore.</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-emerald-700 mb-2">Community</h3>
              <p className="text-gray-700">We support local communities and promote cultural exchange.</p>
            </div>
          </div>
          
          <p className="text-lg text-gray-700 mt-8">
            Join us on this journey to explore the world's most beautiful trails and create memories that will last a lifetime.
          </p>
        </div>
      </div>
    </div>
  );
}

export default About; 