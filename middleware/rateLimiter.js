import rateLimit from "express-rate-limit";

// Rate limiting for auth endpoints
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const refreshTokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many token refresh attempts, please try again later.",
  },
});

// Rate limiting for category routes
export const categoryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many category requests, please try again later.",
  },
});

// Rate limiting for product routes
export const productLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: "Too many product requests, please try again later.",
  },
});
