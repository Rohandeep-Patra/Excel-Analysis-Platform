const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const FileHistory = require("../models/FileHistory");
const File = require("../models/File");

const router = express.Router();

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) {
      return res.status(401).json({ error: "No token, authorization denied" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production"
    );
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token is not valid" });
  }
};

// Get user's file history with pagination and filtering
router.get("/user", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, action, chartType, dateFrom, dateTo, fileName, downloadFormat, analysisType } = req.query;
    const skip = (page - 1) * limit;

    console.log('Received query params:', { page, limit, action, chartType, dateFrom, dateTo, fileName, downloadFormat, analysisType });

    // Build filter object
    const filter = { userId: req.user.id };
    
    if (action) filter.action = action;
    if (chartType) filter.chartType = chartType;
    if (downloadFormat) filter.downloadFormat = downloadFormat;
    if (analysisType) filter.analysisType = analysisType;
    if (fileName) {
      filter.fileName = { $regex: fileName, $options: 'i' };
    }
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    console.log('Constructed filter:', JSON.stringify(filter, null, 2));

    // Get total count for pagination
    const total = await FileHistory.countDocuments(filter);
    console.log('Total documents found:', total);

    // Get history entries with enhanced data
    const history = await FileHistory.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('fileId', 'originalName rowCount columnCount createdAt')
      .populate('relatedActivities', 'action chartType downloadFormat analysisType createdAt');

    // Group by date for better organization
    const groupedHistory = history.reduce((acc, item) => {
      const date = item.createdAt.toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {});

    res.json({
      history: groupedHistory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      filters: {
        action,
        chartType,
        dateFrom,
        dateTo,
        fileName,
        downloadFormat,
        analysisType
      }
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get history statistics for dashboard
router.get("/stats", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get various statistics
    const totalActions = await FileHistory.countDocuments({ userId });
    const totalFiles = await FileHistory.distinct('fileId', { userId }).count();
    const totalCharts = await FileHistory.countDocuments({ 
      userId, 
      action: 'chart_created' 
    });
    const totalDownloads = await FileHistory.countDocuments({ 
      userId, 
      action: { $in: ['pdf_downloaded', 'csv_exported', 'analysis_downloaded'] } 
    });
    const totalAnalyses = await FileHistory.countDocuments({
      userId,
      action: 'analysis'
    });

    // Get action breakdown
    const actionBreakdown = await FileHistory.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get chart type breakdown
    const chartTypeBreakdown = await FileHistory.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), chartType: { $exists: true, $ne: null } } },
      { $group: { _id: '$chartType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get download format breakdown
    const downloadFormatBreakdown = await FileHistory.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), downloadFormat: { $exists: true, $ne: null } } },
      { $group: { _id: '$downloadFormat', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get analysis type breakdown
    const analysisTypeBreakdown = await FileHistory.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), analysisType: { $exists: true, $ne: null } } },
      { $group: { _id: '$analysisType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await FileHistory.find({
      userId,
      createdAt: { $gte: sevenDaysAgo }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('fileId', 'originalName');

    // Get file activity summary
    const fileActivitySummary = await FileHistory.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $group: { 
        _id: '$fileId', 
        fileName: { $first: '$fileName' },
        totalActions: { $sum: 1 },
        chartCount: { $sum: { $cond: [{ $eq: ['$action', 'chart_created'] }, 1, 0] } },
        downloadCount: { $sum: { $cond: [{ $in: ['$action', ['pdf_downloaded', 'csv_exported', 'analysis_downloaded']] }, 1, 0] } },
        analysisCount: { $sum: { $cond: [{ $eq: ['$action', 'analysis'] }, 1, 0] } },
        lastActivity: { $max: '$createdAt' }
      }},
      { $sort: { lastActivity: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalActions,
      totalFiles,
      totalCharts,
      totalDownloads,
      totalAnalyses,
      actionBreakdown,
      chartTypeBreakdown,
      downloadFormatBreakdown,
      analysisTypeBreakdown,
      recentActivity,
      fileActivitySummary
    });
  } catch (error) {
    console.error("Error fetching history stats:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create a new history entry
router.post("/", auth, async (req, res) => {
  try {
    const {
      fileId,
      fileName,
      action,
      chartType,
      selectedAxes,
      chartConfig,
      chartId,
      analysisType,
      analysisResults,
      analysisId,
      downloadFormat,
      downloadUrl,
      downloadFileName,
      downloadSize,
      fileSize,
      rowCount,
      columnCount,
      sessionId,
      tags,
      status,
      errorMessage,
      relatedActivities
    } = req.body;

    // Set appropriate timestamps based on action
    const now = new Date();
    const historyData = {
      userId: req.user.id,
      fileId,
      fileName,
      action,
      chartType,
      selectedAxes,
      chartConfig,
      chartId,
      analysisType,
      analysisResults,
      analysisId,
      downloadFormat,
      downloadUrl,
      downloadFileName,
      downloadSize,
      fileSize,
      rowCount,
      columnCount,
      sessionId,
      tags,
      status: status || 'completed',
      errorMessage,
      relatedActivities,
      metadata: {
        browser: req.headers['user-agent'],
        ipAddress: req.ip,
        screenResolution: req.headers['sec-ch-viewport-width'] ? 
          `${req.headers['sec-ch-viewport-width']}x${req.headers['sec-ch-viewport-height']}` : 'Unknown'
      }
    };

    // Set specific timestamps based on action type
    switch (action) {
      case 'analysis':
        historyData.analysisTime = now;
        break;
      case 'chart_created':
        historyData.chartCreationTime = now;
        break;
      case 'pdf_downloaded':
      case 'csv_exported':
      case 'analysis_downloaded':
        historyData.downloadTime = now;
        break;
    }

    const historyEntry = new FileHistory(historyData);
    await historyEntry.save();

    // Update related activities if provided
    if (relatedActivities && relatedActivities.length > 0) {
      await FileHistory.updateMany(
        { _id: { $in: relatedActivities } },
        { $push: { relatedActivities: historyEntry._id } }
      );
    }

    res.json(historyEntry);
  } catch (error) {
    console.error("Error creating history entry:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get specific history entry
router.get("/:id", auth, async (req, res) => {
  try {
    const historyEntry = await FileHistory.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('fileId');

    if (!historyEntry) {
      return res.status(404).json({ error: "History entry not found" });
    }

    res.json(historyEntry);
  } catch (error) {
    console.error("Error fetching history entry:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete history entry
router.delete("/:id", auth, async (req, res) => {
  try {
    const historyEntry = await FileHistory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!historyEntry) {
      return res.status(404).json({ error: "History entry not found" });
    }

    res.json({ message: "History entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting history entry:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get file activity timeline
router.get("/file/:fileId", auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const fileHistory = await FileHistory.find({
      fileId,
      userId
    })
    .sort({ createdAt: 1 })
    .populate('relatedActivities', 'action chartType downloadFormat analysisType createdAt');

    if (fileHistory.length === 0) {
      return res.status(404).json({ error: "No history found for this file" });
    }

    // Group activities by type
    const activitySummary = {
      uploads: fileHistory.filter(h => h.action === 'upload'),
      analyses: fileHistory.filter(h => h.action === 'analysis'),
      charts: fileHistory.filter(h => h.action === 'chart_created'),
      downloads: fileHistory.filter(h => ['pdf_downloaded', 'csv_exported', 'analysis_downloaded'].includes(h.action)),
      deletions: fileHistory.filter(h => h.action === 'file_deleted')
    };

    res.json({
      fileHistory,
      activitySummary,
      totalActions: fileHistory.length,
      chartCount: activitySummary.charts.length,
      downloadCount: activitySummary.downloads.length,
      analysisCount: activitySummary.analyses.length
    });
  } catch (error) {
    console.error("Error fetching file history:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router; 