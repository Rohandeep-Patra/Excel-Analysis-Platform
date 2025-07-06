const mongoose = require("mongoose");

const fileHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['upload', 'analysis', 'chart_created', 'pdf_downloaded', 'csv_exported', 'file_deleted', 'analysis_downloaded'],
    required: true
  },
  // Chart specific data
  chartType: {
    type: String,
    enum: ['bar', 'line', 'pie', 'scatter', 'doughnut', 'area', 'radar', 'bubble'],
    default: null
  },
  selectedAxes: {
    xAxis: String,
    yAxis: String,
    zAxis: String
  },
  chartConfig: {
    title: String,
    description: String,
    colors: [String],
    options: mongoose.Schema.Types.Mixed
  },
  chartId: {
    type: String,
    default: null
  },
  // Analysis specific data
  analysisType: {
    type: String,
    enum: ['basic_stats', 'correlation', 'trend_analysis', 'outlier_detection', 'custom'],
    default: null
  },
  analysisResults: {
    summary: String,
    insights: [String],
    statistics: mongoose.Schema.Types.Mixed
  },
  analysisId: {
    type: String,
    default: null
  },
  // Download specific data
  downloadFormat: {
    type: String,
    enum: ['pdf', 'csv', 'excel', 'png', 'jpg'],
    default: null
  },
  downloadUrl: String,
  downloadFileName: String,
  downloadSize: Number,
  // File metadata
  fileSize: Number,
  rowCount: Number,
  columnCount: Number,
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  analysisTime: Date,
  downloadTime: Date,
  chartCreationTime: Date,
  // Session and context data
  sessionId: String,
  metadata: {
    browser: String,
    userAgent: String,
    ipAddress: String,
    screenResolution: String,
    timeSpent: Number, // Time spent on analysis in seconds
    chartCount: Number, // Number of charts created for this file
    downloadCount: Number, // Number of downloads for this file
    analysisCount: Number // Number of analyses performed on this file
  },
  // Related activities (for linking multiple actions on same file)
  relatedActivities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileHistory'
  }],
  // Tags for better organization
  tags: [String],
  // Status tracking
  status: {
    type: String,
    enum: ['completed', 'in_progress', 'failed', 'cancelled'],
    default: 'completed'
  },
  errorMessage: String
});

// Index for efficient queries
fileHistorySchema.index({ userId: 1, createdAt: -1 });
fileHistorySchema.index({ fileId: 1, createdAt: -1 });
fileHistorySchema.index({ action: 1, createdAt: -1 });
fileHistorySchema.index({ chartType: 1, createdAt: -1 });
fileHistorySchema.index({ downloadFormat: 1, createdAt: -1 });
fileHistorySchema.index({ analysisType: 1, createdAt: -1 });
fileHistorySchema.index({ 'metadata.chartCount': 1 });
fileHistorySchema.index({ 'metadata.downloadCount': 1 });

// Virtual for formatted timestamps
fileHistorySchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleString();
});

fileHistorySchema.virtual('formattedAnalysisTime').get(function() {
  return this.analysisTime ? this.analysisTime.toLocaleString() : null;
});

fileHistorySchema.virtual('formattedDownloadTime').get(function() {
  return this.downloadTime ? this.downloadTime.toLocaleString() : null;
});

fileHistorySchema.virtual('formattedChartCreationTime').get(function() {
  return this.chartCreationTime ? this.chartCreationTime.toLocaleString() : null;
});

// Ensure virtuals are included in JSON output
fileHistorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("FileHistory", fileHistorySchema); 