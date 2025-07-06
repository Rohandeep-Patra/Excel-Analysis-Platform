const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  rowCount: {
    type: Number,
    default: 0
  },
  columnCount: {
    type: Number,
    default: 0
  },
  columnHeaders: {
    type: [String],
    default: []
  },
  sampleData: {
    type: [[mongoose.Schema.Types.Mixed]],
    default: []
  },
  allSheets: {
    type: [{
      name: String,
      headers: [String],
      data: [[mongoose.Schema.Types.Mixed]],
      totalRows: Number
    }],
    default: []
  },
  status: {
    type: String,
    enum: ["uploaded", "processing", "completed", "error"],
    default: "uploaded"
  },
  analysisData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  charts: {
    type: [{
      chartType: String,
      xAxis: String,
      yAxis: String,
      data: mongoose.Schema.Types.Mixed,
      createdAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
fileSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("File", fileSchema); 