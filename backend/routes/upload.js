const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middlewares/auth");
const XLSX = require("xlsx");
const File = require("../models/File");
const Activity = require("../models/Activity");
const FileHistory = require("../models/FileHistory");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinaryUpload");

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for memory storage (no local files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

// Upload file
router.post("/", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("=== FILE UPLOAD START ===");
    console.log("File info:", {
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file);
    
    if (!cloudinaryResult.success) {
      console.error("Cloudinary upload failed:", cloudinaryResult.error);
      return res.status(500).json({ error: "Failed to upload file to cloud storage" });
    }

    console.log("Cloudinary upload successful:", {
      url: cloudinaryResult.url,
      public_id: cloudinaryResult.public_id,
      size: cloudinaryResult.size
    });

    // Parse Excel file from buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    
    if (sheetNames.length === 0) {
      return res.status(400).json({ error: "Excel file is empty" });
    }

    // Process all sheets
    const allSheets = [];
    let totalRows = 0;
    let totalColumns = 0;
    let columnHeaders = [];

    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 0) {
        const headers = jsonData[0];
        const data = jsonData.slice(1);
        
        allSheets.push({
          name: sheetName,
          headers: headers,
          data: data,
          totalRows: data.length
        });

        totalRows += data.length;
        totalColumns = Math.max(totalColumns, headers.length);
        
        // Use headers from first sheet as main column headers
        if (columnHeaders.length === 0) {
          columnHeaders = headers;
        }
      }
    }

    // Create sample data (first 10 rows from first sheet)
    const sampleData = allSheets.length > 0 ? allSheets[0].data.slice(0, 10) : [];

    console.log("Excel parsing completed:", {
      sheetsCount: allSheets.length,
      totalRows,
      totalColumns,
      columnHeadersLength: columnHeaders.length,
      sampleDataLength: sampleData.length
    });

    // Create file record
    const file = new File({
      userId: req.user.id,
      originalName: req.file.originalname,
      filename: req.file.originalname, // Keep original name for reference
      cloudinaryUrl: cloudinaryResult.url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      cloudinaryAssetId: cloudinaryResult.asset_id,
      fileSize: cloudinaryResult.size,
      fileType: req.file.mimetype,
      rowCount: totalRows,
      columnCount: totalColumns,
      columnHeaders: columnHeaders,
      sampleData: sampleData,
      allSheets: allSheets,
      status: "completed"
    });

    await file.save();

    // Create activity record
    const activity = new Activity({
      userId: req.user.id,
      type: "upload",
      description: `File "${req.file.originalname}" uploaded successfully`,
      fileId: file._id,
      metadata: {
        fileName: req.file.originalname,
        fileSize: cloudinaryResult.size,
        sheetsCount: allSheets.length,
        totalRows,
        totalColumns,
        cloudinaryUrl: cloudinaryResult.url
      }
    });

    await activity.save();

    console.log("=== FILE UPLOAD SUCCESS ===");
    res.json({
      success: true,
      message: "File uploaded successfully",
      file: {
        id: file._id,
        originalName: file.originalName,
        cloudinaryUrl: file.cloudinaryUrl,
        fileSize: file.fileSize,
        rowCount: file.rowCount,
        columnCount: file.columnCount,
        columnHeaders: file.columnHeaders,
        allSheets: file.allSheets,
        status: file.status,
        createdAt: file.createdAt
      }
    });

  } catch (error) {
    console.error("=== FILE UPLOAD ERROR ===", error);
    res.status(500).json({ error: "Error uploading file: " + error.message });
  }
});

// Get file data for analysis
router.get("/file/:fileId", auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json({
      file: {
        id: file._id,
        originalName: file.originalName,
        columnHeaders: file.columnHeaders,
        sampleData: file.sampleData,
        allSheets: file.allSheets,
        stats: {
          rowCount: file.rowCount,
          columnCount: file.columnCount,
          sheetCount: file.allSheets.length
        }
      }
    });

  } catch (error) {
    console.error("Get file error:", error);
    res.status(500).json({ error: "Error retrieving file data" });
  }
});

// Get all user files
router.get("/files", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const files = await File.find({ userId })
      .select('originalName filename createdAt rowCount columnCount status')
      .sort({ createdAt: -1 });

    res.json({ files });

  } catch (error) {
    console.error("Get files error:", error);
    res.status(500).json({ error: "Error retrieving files" });
  }
});

// Delete file
router.delete("/:fileId", auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    console.log("=== FILE DELETE START ===");
    console.log("Deleting file:", {
      id: file._id,
      name: file.originalName,
      cloudinaryPublicId: file.cloudinaryPublicId
    });

    // Delete from Cloudinary
    const cloudinaryResult = await deleteFromCloudinary(file.cloudinaryPublicId);
    
    if (!cloudinaryResult.success) {
      console.error("Cloudinary delete failed:", cloudinaryResult.error);
      // Continue with database deletion even if Cloudinary fails
    } else {
      console.log("Cloudinary delete successful");
    }

    // Delete from database
    await File.findByIdAndDelete(fileId);

    // Create activity record
    const activity = new Activity({
      userId: req.user.id,
      type: "delete",
      description: `File "${file.originalName}" deleted successfully`,
      metadata: {
        fileName: file.originalName,
        fileSize: file.fileSize,
        cloudinaryPublicId: file.cloudinaryPublicId
      }
    });

    await activity.save();

    console.log("=== FILE DELETE SUCCESS ===");
    res.json({
      success: true,
      message: "File deleted successfully"
    });

  } catch (error) {
    console.error("=== FILE DELETE ERROR ===", error);
    res.status(500).json({ error: "Error deleting file: " + error.message });
  }
});

// Utility endpoint to regenerate data for existing files
router.post("/regenerate-data/:fileId", auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    console.log('Regenerating data for file:', { 
      fileId, 
      originalName: file.originalName,
      hasData: !!(file.sampleData && file.sampleData.length > 0)
    });

    // Check if file still exists on disk
    const filePath = path.join(uploadsDir, file.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Physical file not found" });
    }

    // Re-read and parse the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length === 0) {
      return res.status(400).json({ error: "File is empty" });
    }

    const headers = data[0];
    const rows = data.slice(1);

    // Update file with regenerated data
    file.columnHeaders = headers;
    file.sampleData = rows.slice(0, 10);
    file.allSheets = [{ name: sheetName, headers, data: rows, totalRows: rows.length }];
    file.rowCount = rows.length;
    file.columnCount = headers.length;

    await file.save();

    console.log('Data regenerated:', { 
      fileId, 
      columnHeaders: file.columnHeaders,
      sampleDataLength: file.sampleData.length,
      allSheetsLength: file.allSheets.length
    });

    res.json({
      message: "File data regenerated successfully",
      file: {
        id: file._id,
        originalName: file.originalName,
        rowCount: file.rowCount,
        columnCount: file.columnCount,
        columnHeaders: file.columnHeaders
      }
    });
  } catch (error) {
    console.error("Regenerate data error:", error);
    res.status(500).json({ error: "Error regenerating file data" });
  }
});

module.exports = router;
