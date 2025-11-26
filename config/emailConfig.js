import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Use SendGrid instead of Gmail (works on Render)
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey", // This is literalSENDGRID_API_KEY - don't change
    pass: process.env.SENDGRID_API_KEY, // Your SendGrid API key
  },
  // Render-compatible settings
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 45000,
});
// Test connection
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ SendGrid connection failed:", error.message);
  } else {
    console.log("✅ SendGrid is ready to send emails");
  }
});

export default transporter;
