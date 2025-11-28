import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";
import Admin from "../models/admin.js";

const initAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne();

    if (existingAdmin) {
      console.log("✅ Admin user already exists");
      console.log(`👤 Username: ${existingAdmin.username}`);
      console.log(`📧 Email: ${existingAdmin.email}`);
      return;
    }

    // Create admin credentials (matching your frontend)
    const adminCredentials = {
      username: process.env.ADMIN_USERNAME || "admin",
      email: process.env.ADMIN_EMAIL || "",
      passwordHash: await bcrypt.hash(
        process.env.ADMIN_PASSWORD || "password123",
        12
      ),
    };

    // Create the admin user
    const admin = new Admin(adminCredentials);
    await admin.save();

    console.log("🎉 Admin user created successfully!");
    console.log("================================");
    console.log(`👤 Username: ${admin.username}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: ${process.env.ADMIN_PASSWORD || "password123"}`);
    console.log("================================");
    console.log("💡 These credentials match your frontend login form");
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("📡 Database connection closed");
  }
};

// Run the initialization
initAdmin();
