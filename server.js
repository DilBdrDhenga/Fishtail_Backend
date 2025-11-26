import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import fs from "fs";
import helmet from "helmet";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import connectDB from "./config/database.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import adminRouter from "./routes/adminRoutes.js";
import emailRouter from "./routes/emailRoutes.js";
import productRouter from "./routes/productRoutes.js";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// =======================
// Database Connection
// =======================
connectDB();

const app = express();

// =======================
// TRUST PROXY CONFIGURATION (CRITICAL FIX)
// =======================
app.set("trust proxy", 1);

// =======================
// SECURITY MIDDLEWARE
// =======================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https:"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        connectSrc: [
          "'self'",
          process.env.CLIENT_URL,
          "https://your-admin-panel.vercel.app",
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:5501",
        "http://localhost:5500",
        "http://localhost:5501",
        "https://fishtail-geo-survey.vercel.app",
        "https://your-admin-panel.vercel.app",
        "https://admin.fishtail-geo-survey.vercel.app",
        "https://fishtail-backend.onrender.com",
      ];

      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-CSRF-Token",
      "Cookie",
      "CSRF-Token",
      "x-csrf-token",
    ],
    exposedHeaders: ["X-CSRF-Token", "CSRF-Token"],
  })
);

// Cookie parser
app.use(cookieParser());

// Rate Limiting - Fixed for IPv6 compatibility
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Body parsing middleware with limits
app.use(
  express.json({
    limit: process.env.MAX_FILE_SIZE || "10mb",
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({
          success: false,
          message: "Invalid JSON payload",
        });
        throw new Error("Invalid JSON");
      }
    },
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.MAX_FILE_SIZE || "10mb",
  })
);

// Compression middleware
app.use(compression());

// CSRF protection middleware (exclude GET requests and auth endpoints)
app.use((req, res, next) => {
  // Skip CSRF check for GET requests and auth endpoints
  if (
    req.method === "GET" ||
    req.path.includes("/auth/") ||
    req.path === "/api/csrf-token" ||
    req.method === "HEAD" ||
    req.method === "OPTIONS" ||
    req.path === "/api/health" ||
    req.path === "/"
  ) {
    return next();
  }

  const csrfToken =
    req.headers["x-csrf-token"] ||
    req.headers["csrf-token"] ||
    req.headers["CSRF-Token"];

  if (!csrfToken) {
    return res.status(403).json({
      success: false,
      message: "CSRF token required",
    });
  }

  next();
});

// =======================
// ROUTES
// =======================
app.use("/api/auth", adminRouter);
app.use("/api/products", productRouter);
app.use("/api", emailRouter);

// =======================
// HEALTH & STATUS
// =======================
app.get("/api/health", (req, res) => {
  const healthCheck = {
    status: "OK",
    message: "🚀 Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    environment: process.env.NODE_ENV,
    region: process.env.VERCEL_REGION || "local",
    emailService: process.env.SMTP_USER ? "Configured" : "Not configured",
  };

  res.status(200).json(healthCheck);
});

// Generate CSRF token endpoint - FIXED
app.get("/api/csrf-token", (req, res) => {
  try {
    // Use crypto web API properly
    const generateRandomToken = (length = 32) => {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let token = "";
      for (let i = 0; i < length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return token;
    };

    const csrfToken = generateRandomToken(32);

    // Set cookie for CSRF token (not HttpOnly so frontend can read it)
    res.cookie("XSRF-TOKEN", csrfToken, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      data: { csrfToken },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating CSRF token",
    });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Fishtail Geo-Survey Admin API",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    documentation: "/api/health",
    status: "Running on Render",
  });
});

// =======================
// ERROR HANDLING
// =======================
app.use((err, req, res, next) => {
  console.error("🚨 Error:", {
    message: err.message,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Log error to file in production
  if (process.env.NODE_ENV === "production") {
    const errorLogStream = fs.createWriteStream(
      path.join(__dirname, "logs", "errors.log"),
      { flags: "a" }
    );
    errorLogStream.write(`${new Date().toISOString()} - ${err.stack}\n`);
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 1000;
const server = app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log("🚀 Fishtail - PRODUCTION SERVER");
  console.log("=".repeat(60));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔐 CSRF Protection: Enabled`);
  console.log(`🍪 HttpOnly Cookies: Enabled`);
  console.log(`🔧 Trust Proxy: Enabled`);
  console.log("=".repeat(60));
  console.log("✅ Server is ready to handle requests!");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log("🚨 UNHANDLED REJECTION! Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log("🚨 UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});
