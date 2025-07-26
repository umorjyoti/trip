const mongoose = require('mongoose');
const { Trek } = require('../../models');

describe('Trek Model', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect('mongodb://localhost:27017/test_trek_service', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear treks collection before each test
    await Trek.deleteMany({});
  });

  describe('Trek Creation', () => {
    it('should create a trek with valid data', async () => {
      const trekData = {
        name: 'Test Trek',
        description: 'A test trek for unit testing',
        region: 'test-region',
        regionName: 'Test Region',
        difficulty: 'Moderate',
        duration: 2,
        displayPrice: 2500,
        startingPoint: 'Test Start',
        endingPoint: 'Test End',
        highlights: ['Beautiful views', 'Adventure']
      };

      const trek = await Trek.create(trekData);

      expect(trek.name).toBe(trekData.name);
      expect(trek.description).toBe(trekData.description);
      expect(trek.difficulty).toBe(trekData.difficulty);
      expect(trek.duration).toBe(trekData.duration);
      expect(trek.displayPrice).toBe(trekData.displayPrice);
      expect(trek.slug).toBe('test-trek');
      expect(trek.isEnabled).toBe(true);
      expect(trek.category).toBe('all-treks');
      expect(trek.season).toBe('Year-round');
    });

    it('should require name, description, region, difficulty, duration, displayPrice, startingPoint, endingPoint, and highlights', async () => {
      const trek = new Trek({});

      let error;
      try {
        await trek.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.description).toBeDefined();
      expect(error.errors.region).toBeDefined();
      expect(error.errors.difficulty).toBeDefined();
      expect(error.errors.duration).toBeDefined();
      expect(error.errors.displayPrice).toBeDefined();
      expect(error.errors.startingPoint).toBeDefined();
      expect(error.errors.endingPoint).toBeDefined();
      expect(error.errors.highlights).toBeDefined();
    });

    it('should enforce unique slug', async () => {
      const trekData = {
        name: 'Test Trek',
        description: 'A test trek',
        region: 'test-region',
        regionName: 'Test Region',
        difficulty: 'Easy',
        duration: 1,
        displayPrice: 1500,
        startingPoint: 'Start',
        endingPoint: 'End',
        highlights: ['Test']
      };

      await Trek.create(trekData);

      const duplicateTrek = new Trek({
        ...trekData,
        description: 'Another test trek'
      });

      let error;
      try {
        await duplicateTrek.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Duplicate key error
    });

    it('should validate difficulty enum', async () => {
      const trekData = {
        name: 'Test Trek',
        description: 'A test trek',
        region: 'test-region',
        regionName: 'Test Region',
        difficulty: 'Invalid Difficulty',
        duration: 1,
        displayPrice: 1500,
        startingPoint: 'Start',
        endingPoint: 'End',
        highlights: ['Test']
      };

      const trek = new Trek(trekData);

      let error;
      try {
        await trek.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.difficulty).toBeDefined();
    });

    it('should validate minimum duration', async () => {
      const trekData = {
        name: 'Test Trek',
        description: 'A test trek',
        region: 'test-region',
        regionName: 'Test Region',
        difficulty: 'Easy',
        duration: 0,
        displayPrice: 1500,
        startingPoint: 'Start',
        endingPoint: 'End',
        highlights: ['Test']
      };

      const trek = new Trek(trekData);

      let error;
      try {
        await trek.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.duration).toBeDefined();
    });

    it('should validate highlights array is not empty', async () => {
      const trekData = {
        name: 'Test Trek',
        description: 'A test trek',
        region: 'test-region',
        regionName: 'Test Region',
        difficulty: 'Easy',
        duration: 1,
        displayPrice: 1500,
        startingPoint: 'Start',
        endingPoint: 'End',
        highlights: []
      };

      const trek = new Trek(trekData);

      let error;
      try {
        await trek.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.highlights).toBeDefined();
    });
  });

  describe('Slug Generation', () => {
    it('should generate slug from name', async () => {
      const trek = await Trek.create({
        name: 'Amazing Mountain Trek',
        description: 'A test trek',
        region: 'test-region',
        regionName: 'Test Region',
        difficulty: 'Easy',
        duration: 1,
        displayPrice: 1500,
        startingPoint: 'Start',
        endingPoint: 'End',
        highlights: ['Test']
      });

      expect(trek.slug).toBe('amazing-mountain-trek');
    });

    it('should handle special characters in name', async () => {
      const trek = await Trek.create({
        name: 'Trek & Adventure: Special!',
        description: 'A test trek',
        region: 'test-region',
        regionName: 'Test Region',
        difficulty: 'Easy',
        duration: 1,
        displayPrice: 1500,
        startingPoint: 'Start',
        endingPoint: 'End',
        highlights: ['Test']
      });

      expect(trek.slug).toBe('trek-adventure-special');
    });

    it('should handle multiple spaces and hyphens', async () => {
      const trek = await Trek.create({
        name: 'Trek   with    Multiple---Spaces',
        description: 'A test trek',
        region: 'test-region',
        regionName: 'Test Region',
        difficulty: 'Easy',
        duration: 1,
        displayPrice: 1500,
        startingPoint: 'Start',
        endingPoint: 'End',
        highlights: ['Test']
      });

      expect(trek.slug).toBe('trek-with-multiple-spaces');
    });
  });

  describe('Virtual Properties', () => {
    let trek;

    beforeEach(async () => {
      trek = await Trek.create({
        name: 'Test Trek',
        description: 'A test trek',
        region: 'test-region',
        regionName: 'Test Region',
        difficulty: 'Moderate',
        duration: 2,
        displayPrice: 2000,
        strikedPrice: 2500,
        startingPoint: 'Start',
        endingPoint: 'End',
        highlights: ['Test']
      });
    });

    it('should have url virtual', () => {
      expect(trek.url).toBe('/treks/test-trek');
    });

    it('should calculate price range with discount', () => {
      const priceRange = trek.priceRange;
      expect(priceRange.min).toBe(2000);
      expect(priceRange.max).toBe(2500);
      expect(priceRange.hasDiscount).toBe(true);
      expect(priceRange.discount).toBe(20);
    });

    it('should calculate price range without discount', async () => {
      const trekWithoutDiscount = await Trek.create({
        name: 'No Discount Trek',
        description: 'A test trek',
        region: 'test-region',
        regionName: 'Test Region',
        difficulty: 'Easy',
        duration: 1,
        displayPrice: 1500,
        startingPoint: 'Start',
        endingPoint: 'End',
        highlights: ['Test']
      });

      const priceRange = trekWithoutDiscount.priceRange;
      expect(priceRange.min).toBe(1500);
      expect(priceRange.max).toBe(1500);
      expect(priceRange.hasDiscount).toBe(false);
      expect(priceRange.discount).toBe(0);
    });

    it('should calculate difficulty level', () => {
      expect(trek.difficultyLevel).toBe(2);
    });
  });

  describe('Instance Methods', () => {
    let trek;

    beforeEach(async () => {
      trek = await Trek.create({
        name: 'Test Trek',
        description: 'A test trek',
        region: 'test-region',
        regionName: 'Test Region',
        difficulty: 'Easy',
        duration: 1,
        displayPrice: 1500,
        startingPoint: 'Start',
        endingPoint: 'End',
        highlights: ['Test']
      });
    });

    it('should increment view count', async () => {
      const initialViewCount = trek.viewCount;
      await trek.incrementViewCount();
      
      const updatedTrek = await Trek.findById(trek._id);
      expect(updatedTrek.viewCount).toBe(initialViewCount + 1);
    });

    it('should update rating', async () => {
      await trek.updateRating(4);
      expect(trek.averageRating).toBe(4);
      expect(trek.reviewCount).toBe(1);

      await trek.updateRating(5);
      expect(trek.averageRating).toBe(4.5);
      expect(trek.reviewCount).toBe(2);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      await Trek.create([
        {
          name: 'Easy Trek',
          description: 'An easy trek',
          region: 'region1',
          regionName: 'Region 1',
          difficulty: 'Easy',
          duration: 1,
          displayPrice: 1000,
          startingPoint: 'Start',
          endingPoint: 'End',
          highlights: ['Easy'],
          category: 'all-treks',
          bookingCount: 10,
          averageRating: 4.5
        },
        {
          name: 'Moderate Trek',
          description: 'A moderate trek',
          region: 'region2',
          regionName: 'Region 2',
          difficulty: 'Moderate',
          duration: 2,
          displayPrice: 2000,
          startingPoint: 'Start',
          endingPoint: 'End',
          highlights: ['Moderate'],
          category: 'monsoon-treks',
          bookingCount: 20,
          averageRating: 4.8
        },
        {
          name: 'Disabled Trek',
          description: 'A disabled trek',
          region: 'region1',
          regionName: 'Region 1',
          difficulty: 'Easy',
          duration: 1,
          displayPrice: 1500,
          startingPoint: 'Start',
          endingPoint: 'End',
          highlights: ['Disabled'],
          isEnabled: false
        }
      ]);
    });

    it('should find by difficulty', async () => {
      const easyTreks = await Trek.findByDifficulty('Easy');
      expect(easyTreks).toHaveLength(1);
      expect(easyTreks[0].difficulty).toBe('Easy');
      expect(easyTreks[0].isEnabled).toBe(true);
    });

    it('should find by region', async () => {
      const region1Treks = await Trek.findByRegion('region1');
      expect(region1Treks).toHaveLength(1);
      expect(region1Treks[0].region).toBe('region1');
    });

    it('should find by category', async () => {
      const allTreks = await Trek.findByCategory('all-treks');
      expect(allTreks).toHaveLength(1);
      expect(allTreks[0].category).toBe('all-treks');
    });

    it('should find popular treks', async () => {
      const popularTreks = await Trek.findPopular(2);
      expect(popularTreks).toHaveLength(2);
      expect(popularTreks[0].bookingCount).toBeGreaterThanOrEqual(popularTreks[1].bookingCount);
    });

    it('should find featured treks', async () => {
      const featuredTreks = await Trek.findFeatured(5);
      expect(featuredTreks).toHaveLength(2);
      expect(featuredTreks[0].averageRating).toBeGreaterThanOrEqual(4);
      expect(featuredTreks[0].bookingCount).toBeGreaterThanOrEqual(10);
    });
  });
});