const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");
const dashboardRoutes = require("./routes/dashboard");
const analysisRoutes = require("./routes/analysis");
const adminRoutes = require("./routes/admin");
const historyRoutes = require("./routes/history");

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://rohandeepp100:wH4JAomvJIGg7P3H@excelch01.jjyticv.mongodb.net/excel-analysis?retryWrites=true&w=majority";
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

console.log("MONGO_URI:", MONGO_URI ? "Set" : "Not set");
console.log("JWT_SECRET:", JWT_SECRET ? "Set" : "Not set");
console.log("CLOUDINARY_CLOUD_NAME:", CLOUDINARY_CLOUD_NAME ? "Set" : "Not set");
console.log("CLOUDINARY_API_KEY:", CLOUDINARY_API_KEY ? "Set" : "Not set");
console.log("CLOUDINARY_API_SECRET:", CLOUDINARY_API_SECRET ? "Set" : "Not set");

// Validate Cloudinary configuration
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn("⚠️  Cloudinary configuration is incomplete. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.");
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/history", historyRoutes);

app.get("/", (req, res) => {
  res.send("API Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
