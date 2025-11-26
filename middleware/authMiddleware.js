import jwt from "jsonwebtoken";

// Validate JWT token
const validateToken = (token) => {
  try {
    if (!token) {
      throw new Error("No token provided");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "access") {
      throw new Error("Invalid token type");
    }
    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    } else {
      throw new Error("Token validation failed");
    }
  }
};

// Main authentication middleware
export const authenticateToken = (req, res, next) => {
  try {
    let token = req.cookies.accessToken;
    if (!token && req.headers["authorization"]) {
      const authHeader = req.headers["authorization"];
      token = authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : authHeader;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
        code: "NO_TOKEN",
      });
    }

    const user = validateToken(token);
    req.authUser = user;

    // Check if token is nearing expiry
    const timeUntilExpiry = user.exp * 1000 - Date.now();
    if (timeUntilExpiry < 5 * 60 * 1000) {
      // 5 minutes
      res.set("X-Token-Expiry-Soon", "true");
    }
    next();
  } catch (error) {
    // Clear invalid tokens
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }
};

// optional authentication
export const optionalAuth = (req, res, next) => {
  const token =
    req.cookies.accessToken ||
    (req.headers["authorization"] &&
      req.headers["authorization"].split(" ")[1]);

  if (token) {
    try {
      const user = validateToken(token);
      req.authUser = user;
    } catch (error) {
      console.log("Optional auth failed (non-critical)", {
        error: error.message,
        ip: req.ip,
        path: req.path,
      });
    }
  }

  next();
};

// role based authentication
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.authUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.authUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

export const requireAdmin = requireRole(["admin"]);
