const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const File = require("../models/File");
const Activity = require("../models/Activity");

// Get dashboard statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get total files uploaded by user
    const totalFiles = await File.countDocuments({ userId });
    
    // Get files uploaded today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filesToday = await File.countDocuments({
      userId,
      createdAt: { $gte: today }
    });

    // Get recent activities
    const recentActivities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'email');

    // Get total file size and total rows
    const files = await File.find({ userId });
    const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);
    const totalRows = files.reduce((sum, file) => sum + file.rowCount, 0);

    // Format activities for frontend
    const formattedActivities = recentActivities.map(activity => ({
      type: activity.type,
      description: activity.description,
      createdAt: activity.createdAt
    }));

    res.json({
      totalFiles,
      filesToday,
      processedToday: filesToday, // Alias for frontend
      totalRows,
      storageUsed: totalSize,
      recentActivity: formattedActivities
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

router.get("/files", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const files = await File.find({ userId })
      .sort({ createdAt: -1 })
      .select('originalName rowCount columnCount createdAt _id');

    res.json({ files });
  } catch (error) {
    console.error("Error fetching user files:", error);
    res.status(500).json({ error: "Failed to fetch user files" });
  }
});

module.exports = router; 