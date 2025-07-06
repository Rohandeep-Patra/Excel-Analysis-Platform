# Cloudinary Setup Guide

This guide will help you set up Cloudinary for cloud-based file storage in the Excel Analysis Platform.

## What is Cloudinary?

Cloudinary is a cloud service that provides solutions for image and video management, including file storage, optimization, and delivery. We're using it to store Excel files instead of local storage.

## Benefits of Using Cloudinary

- **Scalability**: No local storage limitations
- **Reliability**: Cloud-based storage with high availability
- **Performance**: Global CDN for fast file access
- **Security**: Secure file storage and access
- **Cost-effective**: Pay only for what you use

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [Cloudinary's website](https://cloudinary.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your Cloudinary Credentials

1. Log in to your Cloudinary dashboard
2. Go to the "Dashboard" section
3. Copy the following information:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 3. Configure Environment Variables

Create or update your `.env` file in the backend directory with the following variables:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

Replace the placeholder values with your actual Cloudinary credentials.

### 4. Install Dependencies

The required dependencies have already been installed:
- `cloudinary`: Cloudinary SDK for Node.js
- `multer`: File upload middleware
- `axios`: HTTP client for downloading files

### 5. Test the Setup

1. Start your backend server
2. Upload an Excel file through the frontend
3. Check the console logs for Cloudinary upload confirmation
4. Verify the file is stored in your Cloudinary dashboard

## File Storage Structure

Files are stored in Cloudinary with the following structure:
- **Folder**: `excel-files/`
- **File naming**: `{timestamp}_{original_filename}`
- **Resource type**: `raw` (for Excel files)
- **Format**: `xlsx`

## API Endpoints

The following endpoints have been updated to work with Cloudinary:

### Upload File
- **POST** `/api/upload/`
- Uploads file to Cloudinary and stores metadata in MongoDB

### Delete File
- **DELETE** `/api/upload/:fileId`
- Deletes file from both Cloudinary and MongoDB

### Analysis
- **POST** `/api/analysis/generate-chart`
- Downloads file from Cloudinary for analysis if needed

## Database Schema Changes

The File model has been updated to include Cloudinary fields:

```javascript
{
  cloudinaryUrl: String,        // Direct URL to the file
  cloudinaryPublicId: String,   // Cloudinary public ID
  cloudinaryAssetId: String,    // Cloudinary asset ID
  // ... other fields
}
```

## Error Handling

The system includes comprehensive error handling for:
- Cloudinary upload failures
- Network connectivity issues
- Invalid file formats
- Authentication errors

## Monitoring and Logging

The backend includes detailed logging for:
- File upload progress
- Cloudinary operations
- Error scenarios
- Performance metrics

## Security Considerations

- Files are stored with secure URLs
- Access is controlled through authentication
- File deletion removes from both Cloudinary and database
- API keys are stored securely in environment variables

## Troubleshooting

### Common Issues

1. **"Cloudinary configuration is incomplete"**
   - Check that all environment variables are set correctly
   - Verify your Cloudinary credentials

2. **"Failed to upload file to cloud storage"**
   - Check your internet connection
   - Verify Cloudinary account status
   - Check file size limits (10MB max)

3. **"Could not download file from cloud storage"**
   - Verify the Cloudinary URL is accessible
   - Check file permissions in Cloudinary

### Debug Steps

1. Check backend console logs for detailed error messages
2. Verify environment variables are loaded correctly
3. Test Cloudinary credentials manually
4. Check file format and size requirements

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify your Cloudinary account and credentials
3. Ensure all dependencies are installed correctly
4. Check network connectivity

## Migration from Local Storage

If you're migrating from local storage:
1. Existing files will need to be re-uploaded
2. The system will automatically use Cloudinary for new uploads
3. Old local files can be cleaned up after migration

## Cost Considerations

Cloudinary's free tier includes:
- 25 GB storage
- 25 GB bandwidth per month
- Suitable for development and small-scale usage

For production use, consider upgrading to a paid plan based on your needs. 