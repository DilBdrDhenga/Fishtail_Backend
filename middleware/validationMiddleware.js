import { body, validationResult, param } from "express-validator";
import mongoose from "mongoose";

export const validateLogin = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters")
    .escape(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

// For POST (create) - all fields required
export const validateProductCreate = [
  body("name")
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name is required and must be 2-100 characters")
    .escape(),

  body("description")
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage(
      "Description is required and must be less than 1000 characters"
    )
    .escape(),

  body("category")
    .notEmpty()
    .isIn([
      "Geological & Survey Equipment",
      "Laboratory Testing Equipment",
      "Construction & Civil Engineering Tools",
      "Fire Safety Tools",
      "Safety and Rescue Equipment",
      "Trekking & Outdoor Gears",
    ])
    .withMessage("Category is required and must be valid"),
];

// For PATCH (update) - all fields optional
export const validateProductUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be 2-100 characters")
    .escape(),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 }) // No min length for updates
    .withMessage("Description must be less than 1000 characters")
    .escape(),

  body("category")
    .optional()
    .isIn([
      "Geological & Survey Equipment",
      "Laboratory Testing Equipment",
      "Construction & Civil Engineering Tools",
      "Fire Safety Tools",
      "Safety and Rescue Equipment",
      "Trekking & Outdoor Gears",
    ])
    .withMessage("Invalid product category"),
];

export const validateProductId = [
  param("id")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid product ID format"),
];

export const validateAdminUpdate = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters")
    .escape(),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("newPassword")
    .optional()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters"),
];

// Validation result handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};
