const mongoose = require('mongoose');

// Create a batch schema
const BatchSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  price: {
    type: Number,
    required: true
  },
  maxParticipants: {
    type: Number,
    default: 10
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  actualParticipants: {
    type: Number,
    default: 0
  },
  noShows: {
    type: Number,
    default: 0
  },
  cancellations: {
    type: Number,
    default: 0
  },
  feedback: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]
});

// Create an add-on schema
const AddOnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  isEnabled: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Create an itinerary day schema
const ItineraryDaySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  meals: {
    type: String,
    default: 'Breakfast, Lunch, Dinner'
  },
  accommodation: {
    type: String,
    default: ''
  }
});

// Create a custom field schema
const CustomFieldSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true
  },
  fieldType: {
    type: String,
    enum: ['text', 'number', 'select', 'checkbox'],
    required: true
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  options: [String],
  description: String,
  placeholder: String
}, { _id: false });

// Create a things to pack schema
const ThingsToPackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  icon: String
}, { _id: false });

// Create an activity schema for weekend getaways
const ActivitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: String
  },
  image: {
    type: String
  }
});

// Create a testimonial schema for weekend getaways
const TestimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  image: {
    type: String
  }
});

// Create a mini blog schema for weekend getaways
const MiniBlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  image: {
    type: String
  }
});

// Create a gallery item schema
const GalleryItemSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  caption: {
    type: String
  },
  date: {
    type: Date
  },
  category: {
    type: String,
    enum: ['scenery', 'activities', 'party', 'food', 'accommodation', 'people']
  }
});

const TrekSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Moderate', 'Challenging', 'Difficult', 'Extreme'],
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  distance: {
    type: Number,
    default: 0
  },
  maxAltitude: {
    type: Number
  },
  displayPrice: {
    type: Number,
    required: true
  },
  strikedPrice: {
    type: Number
  },
  images: [String],
  itinerary: [{
    title: String,
    description: String,
    accommodation: String,
    meals: {
      type: String,
      default: 'Breakfast, Lunch, Dinner'
    },
    activities: [String]
  }],
  batches: [BatchSchema],
  thingsToPack: [ThingsToPackSchema],
  includes: [String],
  excludes: [String],
  customFields: [CustomFieldSchema],
  isEnabled: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    enum: ['mountains', 'coastal', 'desert', 'adventure', 'relaxing', 'cultural', 'party'],
    default: 'mountains'
  },
  startingPoint: {
    type: String,
    required: true
  },
  endingPoint: {
    type: String,
    required: true
  },
  isWeekendGetaway: {
    type: Boolean,
    default: false
  },
  weekendHighlights: {
    type: [String],
    default: []
  },
  transportation: {
    type: String,
    default: ''
  },
  departureTime: {
    type: String,
    default: ''
  },
  returnTime: {
    type: String,
    default: ''
  },
  meetingPoint: {
    type: String,
    default: ''
  },
  // New fields for enhanced weekend getaway page
  activities: [ActivitySchema],
  testimonials: [TestimonialSchema],
  miniBlogs: [MiniBlogSchema],
  gallery: [GalleryItemSchema],
  partyDescription: {
    type: String,
    default: ''
  },
  partyImages: [String],
  partyHighlights: [String],
  foodDescription: {
    type: String,
    default: ''
  },
  foodImages: [String],
  accommodationDetails: {
    type: String,
    default: ''
  },
  accommodationImages: [String],
  addOns: {
    type: [AddOnSchema],
    default: []
  },
  itineraryPdfUrl: {
    type: String
  },
  gstPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  gstType: {
    type: String,
    enum: ['included', 'excluded'],
    default: 'excluded'
  },
  gatewayPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  gatewayType: {
    type: String,
    enum: ['customer', 'self'],
    default: 'customer'
  },
  highlights: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length > 0 && v.every(item => item.trim().length > 0);
      },
      message: 'At least one highlight is required'
    }
  },
  faqs: [{
    question: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    }
  }]
});

module.exports = mongoose.model('Trek', TrekSchema); 