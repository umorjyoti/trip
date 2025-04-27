import { FaMountain, FaWater, FaSun, FaHiking, FaCampground, FaBinoculars } from 'react-icons/fa';

export const weekendGetawaysData = [
  {
    _id: '1',
    name: 'Mystic Mountain Escape',
    region: 'Himalayan Foothills',
    difficulty: 'Easy',
    duration: 2,
    price: 4999,
    description: 'Rejuvenate your senses amidst misty mountains and lush greenery. Perfect for a quick escape from the mundane.',
    images: [
      'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    ],
    location: 'Near Shimla',
    category: 'mountains',
    tags: ['relaxing', 'nature', 'hiking'],
    isWeekendGetaway: true,
    weekendHighlights: ['Bonfire Nights Under Stars', 'Guided Nature Walks', 'Local Himachali Cuisine Tasting', 'Panoramic Sunrise Views', 'Stargazing Session'],
    transportation: 'Comfortable Shared Tempo Traveller',
    departureTime: 'Friday 7:00 PM',
    returnTime: 'Sunday 9:00 PM',
    meetingPoint: 'City Center Mall, Main Entrance',
    itinerary: [
      { day: 1, title: 'Arrival & Forest Immersion', description: 'Arrive at our cozy mountain campsite, check-in, and unwind. Embark on a refreshing walk through the enchanting pine forest as dusk settles.', meals: { dinner: true }, icon: FaCampground },
      { day: 2, title: 'Sunrise Trek & Departure', description: 'Wake up early for an optional trek to a stunning sunrise point. Enjoy a hearty breakfast amidst nature before departing back to the city with cherished memories.', meals: { breakfast: true }, icon: FaSun }
    ],
    inclusions: ['Accommodation in comfortable tents/cottages', 'Meals as specified (1 Dinner, 1 Breakfast)', 'Guided walks and activities', 'Round-trip transportation from meeting point', 'Bonfire session'],
    exclusions: ['Personal expenses (snacks, beverages)', 'Any meals not mentioned', 'Travel insurance', 'Optional activities'],
    vibe: 'Relaxing, Nature-focused, Social, Rejuvenating',
    goodToKnow: ['Carry warm layers, especially for evenings.', 'Mobile network connectivity can be intermittent.', 'Suitable for beginners and families.', 'Bring comfortable walking shoes.'],
    gallery: [
       'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
       'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
       'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
       'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
       'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    ],
  },
  {
    _id: '2',
    name: 'Coastal Breeze Ride',
    region: 'Konkan Coast',
    difficulty: 'Moderate',
    duration: 3,
    price: 6500,
    description: 'Feel the sea breeze as you explore scenic coastal routes, pristine beaches, and ancient forts on this exhilarating getaway.',
    images: [
      'https://images.unsplash.com/photo-1476673160081-cf065607f449?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1509233725247-49e657c54213?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    ],
    location: 'Alibaug - Murud Stretch',
    category: 'coastal',
    tags: ['adventure', 'beach', 'road-trip'],
    isWeekendGetaway: true,
    weekendHighlights: ['Beach Camping Experience', 'Scenic Ferry Rides', 'Fresh Seafood Delights', 'Exploration of Sea Forts', 'Sunset at Kihim Beach'],
    transportation: 'Own Bike/Car Recommended (Support vehicle available)',
    departureTime: 'Friday 5:00 AM',
    returnTime: 'Sunday 10:00 PM',
    meetingPoint: 'Gateway of India (for ferry)',
     itinerary: [
      { day: 1, title: 'Ferry & Coastal Ride', description: 'Take the morning ferry to Mandwa, then ride along the scenic coastal road to our beachside campsite near Alibaug.', meals: { dinner: true }, icon: FaWater },
      { day: 2, title: 'Beaches, Forts & Local Life', description: 'Explore Kashid beach, visit Murud-Janjira fort (via boat), and experience the local Konkani culture.', meals: { breakfast: true, lunch: true }, icon: FaHiking },
      { day: 3, title: 'Leisurely Morning & Return', description: 'Enjoy a final coastal breakfast, perhaps a quick dip in the sea, before riding back towards Mandwa for the return ferry.', meals: { breakfast: true }, icon: FaSun }
    ],
    inclusions: ['Accommodation (Beach Camping/Homestay)', 'Meals as specified (2B, 1L, 2D)', 'Ferry tickets (Mumbai-Mandwa return)', 'Route guidance & basic mechanical support', 'Entry fees for specified forts'],
    exclusions: ['Fuel costs', 'Bike/Car rentals', 'Personal expenses', 'Anything not mentioned'],
    vibe: 'Adventurous, Scenic, Road-trip, Cultural',
    goodToKnow: ['Riding/Driving gear recommended.', 'Carry hydration and sun protection.', 'Check ferry timings in advance.', 'Seafood is a highlight!'],
     gallery: [
      'https://images.unsplash.com/photo-1476673160081-cf065607f449?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1509233725247-49e657c54213?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    ],
  },
   {
    _id: '3',
    name: 'Desert Oasis Camp',
    region: 'Thar Desert',
    difficulty: 'Easy',
    duration: 2,
    price: 5500,
    description: 'Immerse yourself in the magic of the Thar desert. Enjoy camel rides, vibrant cultural performances, and camp under a blanket of stars.',
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1516496791181-7055a1406190?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1528310081961-ed570f617a73?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1504198453319-5ce911baf5de?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    ],
    location: 'Near Jaisalmer',
    category: 'desert',
    tags: ['cultural', 'unique', 'camping'],
    isWeekendGetaway: true,
    weekendHighlights: ['Sunset Camel Safari on Dunes', 'Thrilling Jeep Safari (Optional)', 'Live Rajasthani Folk Music & Dance', 'Authentic Rajasthani Thali Dinner', 'Camping in Swiss Tents'],
    transportation: 'Shared Jeep Transfer from Jaisalmer City',
    departureTime: 'Saturday 3:00 PM',
    returnTime: 'Sunday 11:00 AM',
    meetingPoint: 'Jaisalmer Fort Parking Area',
     itinerary: [
      { day: 1, title: 'Desert Arrival & Cultural Evening', description: 'Transfer to our desert camp. Embark on a memorable camel ride to the sand dunes for a breathtaking sunset. Enjoy a vibrant cultural program followed by a traditional dinner.', meals: { dinner: true }, icon: FaCampground },
      { day: 2, title: 'Desert Sunrise & Departure', description: 'Wake up early to witness the serene desert sunrise. After a Rajasthani breakfast, transfer back to Jaisalmer city.', meals: { breakfast: true }, icon: FaSun }
    ],
    inclusions: ['Accommodation in comfortable Swiss Tents', 'Camel Ride', 'Meals as specified (1 Dinner, 1 Breakfast)', 'Cultural Program', 'Return Jeep Transfers from Jaisalmer'],
    exclusions: ['Personal expenses', 'Optional activities like Jeep Safari', 'Travel to/from Jaisalmer city'],
    vibe: 'Cultural, Unique, Relaxing, Immersive',
    goodToKnow: ['Carry sunscreen, sunglasses, and hats.', 'Nights can be cool, bring a light jacket.', 'Respect local customs and traditions.', 'Stay hydrated.'],
     gallery: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1516496791181-7055a1406190?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1528310081961-ed570f617a73?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      'https://images.unsplash.com/photo-1504198453319-5ce911baf5de?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    ],
  }
];

export const sampleCategories = [
  { id: 'all', name: 'All Getaways', icon: '🌍' },
  { id: 'mountains', name: 'Mountains', icon: '⛰️' },
  { id: 'coastal', name: 'Coastal', icon: '🌊' },
  { id: 'desert', name: 'Desert', icon: '🏜️' },
  { id: 'adventure', name: 'Adventure', icon: '🧗' }, // Using tags now
  { id: 'relaxing', name: 'Relaxing', icon: '🧘' }, // Using tags now
  { id: 'cultural', name: 'Cultural', icon: '🎭' }, // Using tags now
];

// Helper function to get category icon
export const getCategoryIcon = (categoryId) => {
  const category = sampleCategories.find(cat => cat.id === categoryId);
  return category ? category.icon : '❓';
}; 