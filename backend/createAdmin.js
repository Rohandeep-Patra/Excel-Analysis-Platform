const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config({ path: "./.env" });

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://rohandeepp100:wH4JAomvJIGg7P3H@excelch01.jjyticv.mongodb.net/excel-analysis?retryWrites=true&w=majority";

async function createAdminUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@excelanalysis.com" });
    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      email: "admin@excelanalysis.com",
      password: "admin123",
      role: "admin",
      status: "active"
    });

    await adminUser.save();
    console.log("Admin user created successfully:");
    console.log("Email: admin@excelanalysis.com");
    console.log("Password: admin123");
    console.log("Role: admin");

  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdminUser(); 