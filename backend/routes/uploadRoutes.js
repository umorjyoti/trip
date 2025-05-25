const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadToS3, s3 } = require('../config/s3');
const mongoose = require('mongoose');

// Get the Trek model using mongoose.model instead of require
const Trek = mongoose.models.Trek || require('../models/trek.model');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Upload endpoint
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('Received upload request:', {
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file',
      headers: req.headers
    });

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Upload to S3
    console.log('Attempting to upload file to S3');
    const fileUrl = await uploadToS3(req.file);
    console.log('File uploaded successfully:', fileUrl);
    
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Error in upload route:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      message: 'Error uploading file', 
      error: error.message,
      code: error.code 
    });
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
    const matchingDocs = await Trek.find({
      $or: [
        { imageUrl: imageUrl },
        { images: imageUrl }
      ]
    });
    console.log('11. Found matching documents:', matchingDocs.length);

    if (matchingDocs.length === 0) {
      // If no exact matches, try a more flexible search
      const allDocs = await Trek.find({
        $or: [
          { imageUrl: { $exists: true, $ne: null } },
          { images: { $exists: true, $ne: [] } }
        ]
      });
      console.log('12. Documents with images:', allDocs.map(doc => ({
        id: doc._id,
        imageUrl: doc.imageUrl,
        images: doc.images
      })));
    }

    // Update all treks that might be using this image
    const updateResult = await Trek.updateMany(
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

    console.log('13. MongoDB update result:', {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      upsertedCount: updateResult.upsertedCount
    });

    if (updateResult.modifiedCount === 0) {
      console.log('14. No documents were updated in MongoDB');
    }

    res.json({ 
      message: 'Image deletion process completed',
      s3Deleted: true,
      mongoUpdated: updateResult.modifiedCount > 0,
      details: {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
        imageUrl: imageUrl,
        actualKey: actualKey,
        matchingDocsCount: matchingDocs.length
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