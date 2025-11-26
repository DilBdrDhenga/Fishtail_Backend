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

// Don't verify on startup (Render blocks SMTP verification)
console.log("📧 Email service: SendGrid configured");

export default transporter;
