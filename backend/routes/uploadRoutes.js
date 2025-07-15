const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadToS3, s3 } = require('../config/s3');
const mongoose = require('mongoose');

// Get the Trek and Region models using mongoose.model instead of require
const Trek = mongoose.models.Trek || require('../models/trek.model');
const Region = mongoose.models.Region || require('../models/Region');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  }
});

// Upload endpoint
router.post('/', upload.single('file'), async (req, res) => {
  console.log('--- /api/upload called ---');
  console.log('Headers:', req.headers);
  if (req.file) {
    console.log('File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } else {
    console.log('No file received in request.');
  }
  try {
    if (!req.file) {
      console.log('No file uploaded, sending 400.');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Determine folder based on file type
    let folder = 'images';
    if (req.file.mimetype === 'application/pdf') {
      folder = 'pdfs';
    }
    req.file.s3Folder = folder;
    console.log('Uploading to S3 folder:', folder);
    const fileUrl = await uploadToS3(req.file);
    console.log('Upload successful, S3 URL:', fileUrl);
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Error in /api/upload:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

// Delete endpoint
router.delete('/:key(*)', async (req, res) => {
  try {
    const { key } = req.params;
    console.log('1. Received delete request for key:', key);
    
    const decodedKey = decodeURIComponent(key);
    console.log('2. Decoded key:', decodedKey);

    // Extract the actual key from the full URL if it's a complete URL
    let actualKey = decodedKey;
    if (decodedKey.includes('amazonaws.com/')) {
      actualKey = decodedKey.split('amazonaws.com/')[1];
      console.log('3. Extracted key after amazonaws.com:', actualKey);
    }

    // Remove bucket name from the key if it's duplicated
    if (actualKey.startsWith(process.env.AWS_S3_BUCKET + '/')) {
      actualKey = actualKey.substring(process.env.AWS_S3_BUCKET.length + 1);
      console.log('4. Removed duplicate bucket name, new key:', actualKey);
    }

    // Ensure we have a valid key
    if (!actualKey) {
      console.error('Invalid key format');
      return res.status(400).json({ 
        message: 'Invalid key format',
        receivedKey: key,
        decodedKey: decodedKey,
        actualKey: actualKey
      });
    }

    console.log('5. Final S3 key to delete:', actualKey);
    console.log('6. Using bucket:', process.env.AWS_S3_BUCKET);

    // Delete from S3
    try {
      const deleteParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: actualKey
      };
      console.log('7. S3 delete params:', deleteParams);
      
      await s3.deleteObject(deleteParams).promise();
      console.log('8. Successfully deleted from S3');
    } catch (s3Error) {
      console.error('9. S3 Delete Error:', {
        message: s3Error.message,
        code: s3Error.code,
        requestId: s3Error.requestId,
        statusCode: s3Error.statusCode
      });
      return res.status(500).json({ 
        message: 'Error deleting from S3',
        error: s3Error.message,
        details: {
          code: s3Error.code,
          requestId: s3Error.requestId,
          statusCode: s3Error.statusCode
        }
      });
    }

    // Construct the URL that should be in MongoDB - using the correct S3 URL format
    const imageUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_S3_BUCKET}/${actualKey}`;
    console.log('10. Looking for URL in MongoDB:', imageUrl);

    // First, find the documents that contain this URL
    const matchingTrekDocs = await Trek.find({
      $or: [
        { imageUrl: imageUrl },
        { images: imageUrl }
      ]
    });
    console.log('11. Found matching trek documents:', matchingTrekDocs.length);

    const matchingRegionDocs = await Region.find({
      $or: [
        { coverImage: imageUrl },
        { images: imageUrl },
        { descriptionImages: imageUrl }
      ]
    });
    console.log('11b. Found matching region documents:', matchingRegionDocs.length);

    if (matchingTrekDocs.length === 0 && matchingRegionDocs.length === 0) {
      // If no exact matches, try a more flexible search
      const allTrekDocs = await Trek.find({
        $or: [
          { imageUrl: { $exists: true, $ne: null } },
          { images: { $exists: true, $ne: [] } }
        ]
      });
      console.log('12. Trek documents with images:', allTrekDocs.map(doc => ({
        id: doc._id,
        imageUrl: doc.imageUrl,
        images: doc.images
      })));

      const allRegionDocs = await Region.find({
        $or: [
          { coverImage: { $exists: true, $ne: null } },
          { images: { $exists: true, $ne: [] } },
          { descriptionImages: { $exists: true, $ne: [] } }
        ]
      });
      console.log('12b. Region documents with images:', allRegionDocs.map(doc => ({
        id: doc._id,
        coverImage: doc.coverImage,
        images: doc.images,
        descriptionImages: doc.descriptionImages
      })));
    }

    // Update all treks that might be using this image
    const trekUpdateResult = await Trek.updateMany(
      { 
        $or: [
          { imageUrl: imageUrl },
          { images: imageUrl }
        ]
      },
      { 
        $pull: { images: imageUrl },
        $set: { 
          imageUrl: { 
            $cond: {
              if: { $eq: ['$imageUrl', imageUrl] },
              then: 'default-trek.jpg',
              else: '$imageUrl'
            }
          }
        }
      }
    );

    // Update all regions that might be using this image
    const regionUpdateResult = await Region.updateMany(
      { 
        $or: [
          { coverImage: imageUrl },
          { images: imageUrl },
          { descriptionImages: imageUrl }
        ]
      },
      { 
        $pull: { 
          images: imageUrl,
          descriptionImages: imageUrl
        },
        $set: { 
          coverImage: { 
            $cond: {
              if: { $eq: ['$coverImage', imageUrl] },
              then: 'default-region.jpg',
              else: '$coverImage'
            }
          }
        }
      }
    );

    console.log('13. MongoDB update results:', {
      trekMatchedCount: trekUpdateResult.matchedCount,
      trekModifiedCount: trekUpdateResult.modifiedCount,
      regionMatchedCount: regionUpdateResult.matchedCount,
      regionModifiedCount: regionUpdateResult.modifiedCount
    });

    if (trekUpdateResult.modifiedCount === 0 && regionUpdateResult.modifiedCount === 0) {
      console.log('14. No documents were updated in MongoDB');
    }

    res.json({ 
      message: 'Image deletion process completed',
      s3Deleted: true,
      mongoUpdated: (trekUpdateResult.modifiedCount > 0 || regionUpdateResult.modifiedCount > 0),
      details: {
        trekMatchedCount: trekUpdateResult.matchedCount,
        trekModifiedCount: trekUpdateResult.modifiedCount,
        regionMatchedCount: regionUpdateResult.matchedCount,
        regionModifiedCount: regionUpdateResult.modifiedCount,
        imageUrl: imageUrl,
        actualKey: actualKey,
        matchingTrekDocsCount: matchingTrekDocs.length,
        matchingRegionDocsCount: matchingRegionDocs.length
      }
    });
  } catch (error) {
    console.error('15. Error in delete route:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Error deleting image',
      error: error.message,
      details: {
        name: error.name,
        stack: error.stack
      }
    });
  }
});

module.exports = router; 