const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  }
});

// Function to upload file to S3
const uploadToS3 = async (file) => {
  try {
    console.log('Starting S3 upload with config:', {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
      folder: 'images',
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype
    });

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `${file.s3Folder || 'images'}/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL: 'public-read'
    };

    console.log('S3 upload params:', {
      ...params,
      Body: '[Buffer]' // Don't log the actual buffer
    });

    const result = await s3.upload(params).promise();
    console.log('S3 upload result:', {
      Location: result.Location,
      Key: result.Key
    });

    // Construct the URL in the correct format
    const imageUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_S3_BUCKET}/${result.Key}`;
    console.log('Constructed image URL:', imageUrl);

    return imageUrl;
  } catch (error) {
    console.error('Error in uploadToS3:', {
      message: error.message,
      code: error.code,
      requestId: error.requestId,
      statusCode: error.statusCode
    });
    throw error;
  }
};

module.exports = {
  s3,
  upload,
  uploadToS3
}; 