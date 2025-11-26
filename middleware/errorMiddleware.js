// middleware/errorMiddleware.js
export const errorHandler = (err, req, res, next) => {
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }
  // Handle specific error types
  if (err.message === "Invalid JSON") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request body",
      error: "VALIDATION_ERROR",
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "Duplicate field value entered",
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", "),
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: err.code || "INTERNAL_ERROR",
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
