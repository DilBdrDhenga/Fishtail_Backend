// test-env.js - Run this to check if .env is loading
import dotenv from "dotenv";

console.log("🧪 Testing .env file loading...");
dotenv.config();

console.log("Loaded environment variables:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log(
  "CLOUDINARY_CLOUD_NAME:",
  process.env.CLOUDINARY_CLOUD_NAME || "NOT FOUND"
);
console.log(
  "CLOUDINARY_API_KEY:",
  process.env.CLOUDINARY_API_KEY ? "FOUND" : "NOT FOUND"
);
console.log(
  "CLOUDINARY_API_SECRET:",
  process.env.CLOUDINARY_API_SECRET ? "FOUND" : "NOT FOUND"
);
console.log("MONGODB_URL:", process.env.MONGODB_URL || "NOT FOUND");

// Run with: node test-env.js
