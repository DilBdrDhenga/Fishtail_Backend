import { Router } from "express";
import {
  getAdminProfile,
  getAuthStats,
  login,
  logout,
  logoutAllDevices,
  refreshToken,
  updateAdminProfile,
  verifyToken,
} from "../controllers/authController.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware.js";
import {
  loginLimiter,
  refreshTokenLimiter,
} from "../middleware/rateLimiter.js";
import {
  handleValidationErrors,
  validateAdminUpdate,
  validateLogin,
} from "../middleware/validationMiddleware.js";

const adminRouter = Router();

// Public routes
adminRouter
  .route("/login")
  .post(loginLimiter, validateLogin, handleValidationErrors, login);
adminRouter.route("/refresh-token").post(refreshTokenLimiter, refreshToken);

// Protected routes
adminRouter.route("/logout").post(authenticateToken, logout);
adminRouter.route("/verify").get(authenticateToken, verifyToken);
adminRouter
  .route("/logout-all")
  .post(authenticateToken, requireAdmin, logoutAllDevices);

// Admin profile routes
adminRouter
  .route("/")
  .get(authenticateToken, requireAdmin, getAdminProfile)
  .patch(
    authenticateToken,
    requireAdmin,
    validateAdminUpdate,
    handleValidationErrors,
    updateAdminProfile
  );

adminRouter.route("/stats").get(authenticateToken, requireAdmin, getAuthStats);

export default adminRouter;
