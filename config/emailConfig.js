import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["SMTP_USER", "SMTP_PASS"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0 && process.env.NODE_ENV === "production") {
  console.error("❌ Missing required environment variables:", missingVars);
  throw new Error("Missing required email configuration");
}

// Configure Nodemailer with SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production", // Strict in production
  },
  // Add connection timeout for production
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

// Enhanced verification with retry logic
const verifyConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await transporter.verify();
      console.log("✅ Email server is ready to take messages");
      return true;
    } catch (error) {
      console.log(
        `❌ Email connection attempt ${i + 1} failed:`,
        error.message
      );
      if (i === retries - 1) {
        if (process.env.NODE_ENV === "production") {
          console.error("🚨 CRITICAL: Email service unavailable in production");
          // Don't throw in production to allow server to start
          return false;
        } else {
          throw error;
        }
      }
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  return false;
};

// Verify connection on startup
if (process.env.NODE_ENV !== "test") {
  verifyConnection().then((success) => {
    if (!success && process.env.NODE_ENV === "production") {
      console.log(
        "⚠️  Email service unavailable, but server will continue running"
      );
    }
  });
}

export default transporter;
