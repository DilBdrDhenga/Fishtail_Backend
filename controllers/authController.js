import jwt from "jsonwebtoken";
import Admin from "../models/admin.js";
import bcrypt from "bcryptjs";
import RefreshToken from "../models/refreshToken.js";
import FailedAttempt from "../models/failedAttempt.js";
import {
  formatErrorResponse,
  formatSuccessResponse,
} from "../utils/responseHelpers.js";
import { isValidEmail } from "../utils/validationHelpers.js";
import { sanitizeInput } from "../utils/stringHelpers.js";

// Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
const COOKIE_CONFIG = {
  access: {
    httpOnly: true,
    secure: true, // HTTPS only in production
    sameSite: "strict", // Strict same-site policy
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
    domain: process.env.COOKIE_DOMAIN,
  },
  refresh: {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
    domain: process.env.COOKIE_DOMAIN,
  },
};

// Helper functions
const isAccountLocked = async (ip) => {
  const attempt = await FailedAttempt.findOne({ ip });
  if (!attempt) return false;

  const isLocked =
    attempt.count >= MAX_LOGIN_ATTEMPTS &&
    Date.now() - attempt.lastAttempt < LOCKOUT_TIME;

  return isLocked;
};

const trackFailedAttempt = async (ip) => {
  const attempt = await FailedAttempt.findOne({ ip });

  if (attempt) {
    attempt.count += 1;
    attempt.lastAttempt = new Date();
    await attempt.save();
  } else {
    await FailedAttempt.create({
      ip,
      count: 1,
      lastAttempt: new Date(),
    });
  }
};

const clearFailedAttempts = async (ip) => {
  await FailedAttempt.deleteOne({ ip });
};

const generateTokens = (admin) => {
  // Validate that required environment variables are set
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET environment variable is required");
  }
  const accessToken = jwt.sign(
    {
      id: admin._id,
      username: admin.username,
      role: "admin",
      type: "access",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
      issuer: process.env.JWT_ISSUER,
    }
  );

  const refreshToken = jwt.sign(
    {
      id: admin._id,
      username: admin.username,
      type: "refresh",
      tokenVersion: admin.tokenVersion || 1,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      issuer: process.env.JWT_ISSUER,
    }
  );

  return { accessToken, refreshToken };
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearTokenCookies = (res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
};

// Main controller functions
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res
        .status(400)
        .json(
          formatErrorResponse(
            "Username and password are required",
            "VALIDATION_ERROR"
          )
        );
    }

    // Check if account is locked
    if (await isAccountLocked(req.ip)) {
      return res
        .status(429)
        .json(
          formatErrorResponse(
            "Too many failed attempts. Please try again later.",
            "RATE_LIMITED"
          )
        );
    }

    // Get admin user with password hash
    const admin = await Admin.findOne({ username }).select("+passwordHash");
    if (!admin) {
      await trackFailedAttempt(req.ip);
      return res
        .status(401)
        .json(
          formatErrorResponse(
            "Invalid username or password",
            "INVALID_CREDENTIALS"
          )
        );
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res
        .status(403)
        .json(
          formatErrorResponse(
            "Admin account is deactivated",
            "ACCOUNT_DEACTIVATED"
          )
        );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      await trackFailedAttempt(req.ip);
      return res
        .status(401)
        .json(
          formatErrorResponse(
            "Invalid username or password",
            "INVALID_CREDENTIALS"
          )
        );
    }

    // Clear failed attempts on successful login
    await clearFailedAttempts(req.ip);
    await admin.updateLastLogin();

    const { accessToken, refreshToken } = generateTokens(admin);
    await RefreshToken.create({
      token: refreshToken,
      adminId: admin._id,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    // Set HttpOnly cookies
    setTokenCookies(res, accessToken, refreshToken);

    res.json(
      formatSuccessResponse(
        {
          accessToken,
          refreshToken,
          admin: {
            id: admin._id,
            username: admin.username,
            email: admin.email,
            lastLogin: admin.lastLogin,
          },
        },
        "Login successful"
      )
    );
  } catch (error) {
    console.error("Login error:", error);

    // Handle missing environment variables
    if (error.message.includes("environment variable is required")) {
      return res
        .status(500)
        .json(formatErrorResponse("Server configuration error"));
    }

    res
      .status(500)
      .json(formatErrorResponse("Internal server error during login"));
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.authUser.id);
    if (!admin) {
      return res
        .status(404)
        .json(formatErrorResponse("Admin not found", "NOT_FOUND"));
    }

    res.json(
      formatSuccessResponse({
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt,
        },
      })
    );
  } catch (error) {
    res.status(500).json(formatErrorResponse("Error fetching admin profile"));
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.authUser.id).select("+passwordHash");

    if (!admin) {
      return res
        .status(404)
        .json(formatErrorResponse("Admin not found", "NOT_FOUND"));
    }

    const updatedFields = [];

    // Update username if provided
    if (username) {
      const sanitizedUsername = sanitizeInput(username);

      if (sanitizedUsername.length < 3) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              "Username must be at least 3 characters long",
              "VALIDATION_ERROR"
            )
          );
      }

      const existingAdmin = await Admin.findOne({
        username: sanitizedUsername,
        _id: { $ne: admin._id },
      });

      if (existingAdmin) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              "Username is already taken",
              "DUPLICATE_USERNAME"
            )
          );
      }

      admin.username = sanitizedUsername;
      updatedFields.push("username");
    }

    // Update email if provided
    if (email) {
      const sanitizedEmail = sanitizeInput(email);

      if (!isValidEmail(sanitizedEmail)) {
        return res
          .status(400)
          .json(
            formatErrorResponse("Invalid email format", "VALIDATION_ERROR")
          );
      }

      const existingAdmin = await Admin.findOne({
        email: sanitizedEmail,
        _id: { $ne: admin._id },
      });

      if (existingAdmin) {
        return res
          .status(400)
          .json(
            formatErrorResponse("Email is already taken", "DUPLICATE_EMAIL")
          );
      }

      admin.email = sanitizedEmail;
      updatedFields.push("email");
    }

    // Verify current password if changing password
    if (newPassword) {
      if (!currentPassword) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              "Current password is required to set new password",
              "VALIDATION_ERROR"
            )
          );
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        admin.passwordHash
      );

      if (!isCurrentPasswordValid) {
        return res
          .status(401)
          .json(
            formatErrorResponse(
              "Current password is incorrect",
              "INVALID_PASSWORD"
            )
          );
      }

      if (newPassword.length < 8) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              "New password must be at least 8 characters long",
              "VALIDATION_ERROR"
            )
          );
      }

      admin.passwordHash = await bcrypt.hash(newPassword, 12);
      updatedFields.push("password");
    }

    // Check if at least one field is being updated
    if (updatedFields.length === 0) {
      return res
        .status(400)
        .json(
          formatErrorResponse(
            "No fields to update. Provide username, email, or new password.",
            "VALIDATION_ERROR"
          )
        );
    }

    await admin.save();

    res.json(
      formatSuccessResponse({ updatedFields }, "Profile updated successfully")
    );
  } catch (error) {
    console.error("Update admin profile error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res
        .status(400)
        .json(
          formatErrorResponse(`${field} is already taken`, "DUPLICATE_DATA")
        );
    }

    res.status(500).json(formatErrorResponse("Error updating admin profile"));
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res
        .status(401)
        .json(formatErrorResponse("Refresh token required", "MISSING_TOKEN"));
    }

    // Check if refresh token exists in database
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
    }).populate("adminId");

    if (!storedToken) {
      return res
        .status(403)
        .json(
          formatErrorResponse(
            "Invalid or expired refresh token",
            "INVALID_TOKEN"
          )
        );
    }

    // Verify JWT refresh token
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, decoded) => {
        if (err) {
          await RefreshToken.deleteOne({ token: refreshToken });
          return res
            .status(403)
            .json(
              formatErrorResponse("Invalid refresh token", "INVALID_TOKEN")
            );
        }

        // Check if admin still exists and is active
        if (!storedToken.adminId || !storedToken.adminId.isActive) {
          await RefreshToken.deleteOne({ token: refreshToken });
          return res
            .status(403)
            .json(
              formatErrorResponse(
                "Admin account no longer active",
                "ACCOUNT_INACTIVE"
              )
            );
        }

        // Generate new tokens
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          generateTokens(storedToken.adminId);

        // Delete the old refresh token and store the new one
        await RefreshToken.deleteOne({ token: refreshToken });
        await RefreshToken.create({
          token: newRefreshToken,
          adminId: storedToken.adminId._id,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });
        // Set new HttpOnly cookies
        setTokenCookies(res, newAccessToken, newRefreshToken);

        res.json(
          formatSuccessResponse({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          })
        );
      }
    );
  } catch (error) {
    res
      .status(500)
      .json(formatErrorResponse("Internal server error during token refresh"));
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Delete token from database
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    // Clear cookies with explicit options
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    return res.json(formatSuccessResponse(null, "Logout successful"));
  } catch (error) {
    // Still try to clear cookies on error
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res
      .status(500)
      .json(formatErrorResponse("Internal server error during logout"));
  }
};

export const logoutAllDevices = async (req, res) => {
  try {
    const adminId = req.authUser.id;

    // Check if admin exists and is active
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(404)
        .json(formatErrorResponse("Admin not found", "NOT_FOUND"));
    }

    if (!admin.isActive) {
      return res
        .status(403)
        .json(
          formatErrorResponse(
            "Admin account is deactivated",
            "ACCOUNT_DEACTIVATED"
          )
        );
    }

    // Count active sessions before deletion
    const activeSessionsCount = await RefreshToken.countDocuments({
      adminId: adminId,
    });

    if (activeSessionsCount === 0) {
      return res.json(
        formatSuccessResponse(
          { sessionsTerminated: 0 },
          "No active sessions found. You are already logged out from all devices."
        )
      );
    }

    // Delete all refresh tokens for this admin
    const result = await RefreshToken.deleteMany({ adminId: adminId });

    res.json(
      formatSuccessResponse(
        { sessionsTerminated: result.deletedCount },
        `Successfully logged out from all devices. ${result.deletedCount} session(s) terminated.`
      )
    );
  } catch (error) {
    console.error("Logout all devices error:", error);
    res
      .status(500)
      .json(formatErrorResponse("Internal server error during logout"));
  }
};

export const verifyToken = (req, res) => {
  try {
    res.json(
      formatSuccessResponse(
        {
          user: {
            id: req.authUser.id,
            username: req.authUser.username,
            role: req.authUser.role,
          },
        },
        "Token is valid"
      )
    );
  } catch (error) {
    res.status(401).json(formatErrorResponse("Invalid token", "INVALID_TOKEN"));
  }
};

// Utility function to get stats (for admin monitoring)
export const getAuthStats = async () => {
  const activeRefreshTokens = await RefreshToken.countDocuments();
  const failedAttemptsCount = await FailedAttempt.countDocuments();

  // Count locked IPs
  const allAttempts = await FailedAttempt.find();
  const lockedIPs = allAttempts.filter(
    (attempt) =>
      attempt.count >= MAX_LOGIN_ATTEMPTS &&
      Date.now() - attempt.lastAttempt < LOCKOUT_TIME
  ).length;

  return {
    activeRefreshTokens,
    failedAttempts: failedAttemptsCount,
    lockedIPs,
  };
};
