const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middlewares/auth");
const XLSX = require("xlsx");
const File = require("../models/File");
const Activity = require("../models/Activity");

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    cb(null, allowedTypes.includes(file.mimetype));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Upload Excel file
router.post("/excel", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (
      req.file.mimetype !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
      req.file.mimetype !== "application/vnd.ms-excel"
    ) {
      return res.status(400).json({ error: "Invalid file format" });
    }

    const userId = req.user.id;
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Map fields to match the File model schema
    const fileDoc = new File({
      userId: userId, // Changed from uploadedBy to userId
      originalName: req.file.originalname,
      filename: req.file.filename,
      fileSize: req.file.size, // Changed from size to fileSize
      fileType: req.file.mimetype, // Changed from mimetype to fileType
      rowCount: data.length,
      columnCount: data[0] ? data[0].length : 0,
      columnHeaders: data[0] || [],
      sampleData: data.slice(1, 11), // First 10 rows of data
      allSheets: [{
        name: sheetName,
        headers: data[0] || [],
        data: data.slice(1), // All data except headers
        totalRows: data.length - 1
      }],
      status: "uploaded"
    });
    await fileDoc.save();

    // Activity log - Fixed to match Activity model schema
    const activity = new Activity({
      userId: userId, // Changed from user to userId
      type: "upload", // Changed from action to type
      description: `${req.file.originalname} uploaded successfully (${data.length} rows, ${data[0] ? data[0].length : 0} columns)`, // Added description
      fileId: fileDoc._id,
      metadata: {
        filename: req.file.originalname,
        size: req.file.size,
        rows: data.length,
        columns: data[0] ? data[0].length : 0
      }
    });
    await activity.save();

    res.json({
      message: "File uploaded and parsed successfully",
      file: req.file.originalname,
      fileId: fileDoc._id,
      data: {
        rows: data.length,
        columns: data[0] ? data[0].length : 0,
        headers: data[0] || [],
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
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

// Delete a file
router.delete("/file/:fileId", auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // Find the file and verify ownership
    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Delete the file from the database
    await File.findByIdAndDelete(fileId);

    // Delete the physical file if it exists
    const filePath = path.join(uploadsDir, file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Create activity record for deletion
    const activity = new Activity({
      userId: userId,
      type: "delete",
      description: `${file.originalName} deleted`,
      fileId: fileId,
      metadata: {
        filename: file.originalName,
        size: file.fileSize
      }
    });
    await activity.save();

    res.json({ message: "File deleted successfully" });

  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({ error: "Error deleting file" });
  }
});

module.exports = router;
