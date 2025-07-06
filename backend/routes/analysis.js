const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const File = require("../models/File");
const Activity = require("../models/Activity");

// Generate chart data
router.post("/chart", auth, async (req, res) => {
  try {
    const { fileId, chartType, xAxis, yAxis } = req.body;
    const userId = req.user.id;

    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Get the parsed data
    const data = file.allSheets[0]?.data || [];
    const headers = file.columnHeaders;

    // Find column indices
    const xIndex = headers.indexOf(xAxis);
    const yIndex = headers.indexOf(yAxis);

    if (xIndex === -1 || yIndex === -1) {
      return res.status(400).json({ error: "Selected columns not found" });
    }

    // Process data based on chart type
    let chartData = {};
    
    switch (chartType) {
      case 'bar':
      case 'line':
        chartData = processBarLineData(data, xIndex, yIndex);
        break;
      case 'pie':
      case 'doughnut':
        chartData = processPieData(data, xIndex, yIndex);
        break;
      case 'scatter':
        chartData = processScatterData(data, xIndex, yIndex);
        break;
      default:
        return res.status(400).json({ error: "Unsupported chart type" });
    }

    // Create activity record
    const activity = new Activity({
      userId: userId,
      type: "analysis",
      description: `${chartType} chart generated for ${file.originalName} (${xAxis} vs ${yAxis})`,
      fileId: file._id,
      metadata: {
        chartType,
        xAxis,
        yAxis,
        chartData
      }
    });

    await activity.save();

    res.json({
      success: true,
      chartData,
      message: `${chartType} chart generated successfully`
    });

  } catch (error) {
    console.error("Chart generation error:", error);
    res.status(500).json({ error: "Error generating chart" });
  }
});

// Get file analysis history
router.get("/file/:fileId/charts", auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const activities = await Activity.find({
      user: userId,
      "details.fileId": fileId,
      action: "chart_created"
    }).sort({ createdAt: -1 });
    
    res.json({
      charts: activities,
      fileName: file.originalName
    });

  } catch (error) {
    console.error("Get charts error:", error);
    res.status(500).json({ error: "Error retrieving charts" });
  }
});

// Helper functions for data processing
function processBarLineData(data, xIndex, yIndex) {
  const labels = [];
  const values = [];
  
  data.forEach(row => {
    if (row[xIndex] && row[yIndex]) {
      labels.push(row[xIndex].toString());
      values.push(parseFloat(row[yIndex]) || 0);
    }
  });

  return {
    labels,
    datasets: [{
      label: 'Data',
      data: values,
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1
    }]
  };
}

function processPieData(data, xIndex, yIndex) {
  const labels = [];
  const values = [];
  
  data.forEach(row => {
    if (row[xIndex] && row[yIndex]) {
      labels.push(row[xIndex].toString());
      values.push(parseFloat(row[yIndex]) || 0);
    }
  });

  return {
    labels,
    datasets: [{
      data: values,
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)'
      ]
    }]
  };
}

function processScatterData(data, xIndex, yIndex) {
  const points = [];
  
  data.forEach(row => {
    if (row[xIndex] && row[yIndex]) {
      points.push({
        x: parseFloat(row[xIndex]) || 0,
        y: parseFloat(row[yIndex]) || 0
      });
    }
  });

  return {
    datasets: [{
      label: 'Data Points',
      data: points,
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      pointRadius: 6
    }]
  };
}

// Get file data for analysis
router.get("/:fileId", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileId } = req.params;

    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json({
      file: {
        id: file._id,
        filename: file.originalName,
        metadata: {
          sheetName: file.allSheets[0]?.name,
          rows: file.rowCount,
          columns: file.columnCount,
          headers: file.columnHeaders
        },
        parsedData: file.allSheets[0]?.data || []
      }
    });
  } catch (error) {
    console.error("Get file error:", error);
    res.status(500).json({ error: "Failed to fetch file data" });
  }
});

// Get analysis history
router.get("/history/:fileId", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileId } = req.params;

    const analyses = await Activity.find({
      userId,
      fileId: fileId,
      type: { $in: ["analysis", "chart_created"] }
    }).sort({ createdAt: -1 });

    res.json({ analyses });
  } catch (error) {
    console.error("Get analysis history error:", error);
    res.status(500).json({ error: "Failed to fetch analysis history" });
  }
});

// Save chart analysis
router.post("/save-chart", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileId, chartType, chartData, chartConfig } = req.body;

    // Verify file belongs to user
    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Create activity record for chart creation
    const activity = new Activity({
      userId: userId,
      type: "analysis",
      description: `Chart analysis saved for ${file.originalName}`,
      fileId: fileId,
      metadata: {
        chartType,
        chartData,
        chartConfig
      }
    });
    await activity.save();

    res.json({ message: "Chart analysis saved successfully" });
  } catch (error) {
    console.error("Save chart error:", error);
    res.status(500).json({ error: "Failed to save chart analysis" });
  }
});

// Get comprehensive analysis data for PDF generation
router.get("/pdf-data/:fileId", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileId } = req.params;

    // Get file data
    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Get all analysis activities for this file
    const analyses = await Activity.find({
      userId,
      fileId: fileId,
      type: { $in: ["analysis", "chart_created"] }
    }).sort({ createdAt: -1 });

    // Get chart history
    const chartHistory = await Activity.find({
      userId,
      fileId: fileId,
      type: "analysis"
    }).sort({ createdAt: -1 }).limit(20);

    // Calculate file statistics
    const fileStats = {
      totalRows: file.rowCount,
      totalColumns: file.columnCount,
      totalSheets: file.allSheets.length,
      fileSize: file.fileSize,
      uploadDate: file.createdAt,
      lastModified: file.updatedAt
    };

    // Calculate analysis statistics
    const analysisStats = {
      totalAnalyses: analyses.length,
      chartTypes: [...new Set(analyses.map(a => a.metadata?.chartType).filter(Boolean))],
      lastAnalysis: analyses[0]?.createdAt,
      mostUsedChartType: analyses.length > 0 ? 
        analyses.reduce((acc, curr) => {
          const type = curr.metadata?.chartType;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}) : {}
    };

    res.json({
      file: {
        id: file._id,
        originalName: file.originalName,
        stats: fileStats,
        allSheets: file.allSheets
      },
      analyses: analyses,
      chartHistory: chartHistory,
      analysisStats: analysisStats,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error("Get PDF data error:", error);
    res.status(500).json({ error: "Failed to fetch PDF data" });
  }
});

module.exports = router; 