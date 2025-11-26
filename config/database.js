import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const MONGODB_URL = process.env.MONGODB_URL;
    if (!MONGODB_URL) {
      console.error("❌ MONGODB_URL is not defined in environment variables");
      process.exit(1);
    }
    const conn = await mongoose.connect(MONGODB_URL);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log("=".repeat(60));
    return conn;
  } catch (error) {
    console.error("❌ Database connection error:", error);
    process.exit(1);
  }
};

// MongoDB connection event handlers
mongoose.connection.on("connected", () => {
  console.log("✅ Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Received SIGINT. Closing server gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🛑 Received SIGTERM. Closing server gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

export default connectDB;
