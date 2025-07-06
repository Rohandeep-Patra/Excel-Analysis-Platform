const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');
const path = require('path');

// Upload file to Cloudinary
const uploadToCloudinary = async (file, folder = 'excel-files') => {
  try {
    const originalName = file.originalname;
    const timestamp = Date.now();
    // Remove extension and sanitize
    const baseName = path.parse(originalName).name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const publicId = `${folder}/${timestamp}_${baseName}`;

    // Convert buffer to stream
    const stream = Readable.from(file.buffer);
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'raw',
          format: 'xlsx',
          public_id: publicId,
          overwrite: true,
          invalidate: true
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      stream.pipe(uploadStream);
    });

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      asset_id: result.asset_id,
      format: result.format,
      size: result.bytes,
      created_at: result.created_at
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (public_id) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: 'raw'
    });
    
    return {
      success: true,
      result: result
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get file info from Cloudinary
const getFileInfo = async (public_id) => {
  try {
    const result = await cloudinary.api.resource(public_id, {
      resource_type: 'raw'
    });
    
    return {
      success: true,
      info: result
    };
  } catch (error) {
    console.error('Cloudinary get info error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getFileInfo
}; 