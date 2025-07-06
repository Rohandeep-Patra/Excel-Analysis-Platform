const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const User = require("../models/User");
const File = require("../models/File");
const Activity = require("../models/Activity");

// Admin middleware to check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get platform statistics
router.get("/stats", auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFiles = await File.countDocuments();
    const totalActivities = await Activity.countDocuments();

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
    const filesUploadedToday = await File.countDocuments({ createdAt: { $gte: today } });

    // Get total storage used
    const files = await File.find();
    const totalStorage = files.reduce((sum, file) => sum + file.size, 0);

    res.json({
      totalUsers,
      totalFiles,
      totalActivities,
      newUsersToday,
      filesUploadedToday,
      totalStorage
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch admin statistics" });
  }
});

// Get all users
router.get("/users", auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Update user status
router.put("/users/:userId", auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Get recent activities
router.get("/activities", auth, adminAuth, async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('user', 'email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ activities });
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

module.exports = router; 