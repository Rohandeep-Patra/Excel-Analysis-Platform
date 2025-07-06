const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middlewares/auth");
const Activity = require("../models/Activity");

const router = express.Router();

// Register user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production",
      { expiresIn: "7d" }
    );

    // Create activity record
    const activity = new Activity({
      userId: user._id,
      type: "register",
      description: "User registered successfully",
      metadata: {
        email: user.email,
        name: user.name
      }
    });
    await activity.save();

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production",
      { expiresIn: "7d" }
    );

    // Create activity record
    const activity = new Activity({
      userId: user._id,
      type: "login",
      description: "User logged in successfully",
      metadata: {
        email: user.email,
        loginTime: new Date()
      }
    });
    await activity.save();

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    if (!userId) {
      console.error('Profile update: No userId in token');
      return res.status(401).json({ error: "Invalid or expired token. Please log in again." });
    }

    if (!name && !email) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    // If email is being updated, validate and check for duplicates
    if (email !== undefined) {
      if (!email.trim()) {
        return res.status(400).json({ error: "Email is required" });
      }
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: "Email is already in use" });
      }
    }

    // Prepare update object
    const updateData = {};
    if (email !== undefined) updateData.email = email.trim();
    if (name !== undefined) updateData.name = name.trim();

    console.log('Profile update for userId:', userId, 'with data:', updateData);

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      console.error('Profile update: User not found for userId:', userId);
      return res.status(404).json({ error: "User not found. Please log in again." });
    }

    // Get current user data for activity log
    const currentUser = await User.findById(userId);
    
    // Create activity record
    const activity = new Activity({
      userId: userId,
      type: "profile_update",
      description: "Profile updated successfully",
      metadata: {
        updatedFields: updateData,
        previousName: currentUser?.name || '',
        previousEmail: currentUser?.email || ''
      }
    });
    await activity.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update profile error:", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email is already in use" });
    }
    
    res.status(500).json({ error: "Server error" });
  }
});

// Change password
router.put("/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: "New password must be different from current password" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Create activity record
    const activity = new Activity({
      userId: userId,
      type: "password_change",
      description: "Password changed successfully",
      metadata: {
        changeTime: new Date()
      }
    });
    await activity.save();

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Change password error:", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: "Server error" });
  }
});

// Delete account
router.delete("/account", auth, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Password is incorrect" });
    }

    // Create activity record before deletion
    const activity = new Activity({
      userId: userId,
      type: "account_deletion",
      description: "Account deleted by user",
      metadata: {
        deletionTime: new Date(),
        email: user.email || '',
        name: user.name || ''
      }
    });
    await activity.save();

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
