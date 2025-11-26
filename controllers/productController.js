import mongoose from "mongoose";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../config/cloudinary.js";
import Product from "../models/product.js";
import {
  formatErrorResponse,
  formatSuccessResponse,
} from "../utils/responseHelpers.js";

// get all products
export const getProducts = async (req, res) => {
  try {
    const { category } = req.query;

    // Build filter object
    const filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .select("-__v");

    res.json(
      formatSuccessResponse({
        products,
        count: products.length,
      })
    );
  } catch (error) {
    res.status(500).json(formatErrorResponse("Error fetching products"));
  }
};

// Get products by category (public)
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    // Validate category
    const validCategories = [
      "Geological & Survey Equipment",
      "Laboratory Testing Equipment",
      "Construction & Civil Engineering Tools",
      "Fire Safety Tools",
      "Safety and Rescue Equipment",
      "Trekking & Outdoor Gears",
    ];

    if (!validCategories.includes(category)) {
      return res
        .status(400)
        .json(formatErrorResponse("Invalid category", "VALIDATION_ERROR"));
    }

    const products = await Product.find({ category }).sort({ createdAt: -1 });

    res.json(
      formatSuccessResponse({
        products,
        category,
        count: products.length,
      })
    );
  } catch (error) {
    console.error("Get products by category error:", error);
    res
      .status(500)
      .json(formatErrorResponse("Error fetching products by category"));
  }
};

// get single product
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json(
          formatErrorResponse("Invalid product ID format", "VALIDATION_ERROR")
        );
    }

    const product = await Product.findById(id).select("-__v");

    if (!product) {
      return res
        .status(404)
        .json(formatErrorResponse("Product not found", "NOT_FOUND"));
    }

    res.json(formatSuccessResponse(product));
  } catch (error) {
    res.status(500).json(formatErrorResponse("Error fetching product"));
  }
};

// create product
export const createProduct = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    // Check if image is provided
    if (!req.file) {
      return res
        .status(400)
        .json(
          formatErrorResponse("Product image is required", "VALIDATION_ERROR")
        );
    }

    // Check for duplicate product name
    const existingProduct = await Product.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existingProduct) {
      return res
        .status(409)
        .json(
          formatErrorResponse(
            "Product with this name already exists",
            "DUPLICATE_PRODUCT"
          )
        );
    }

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(
      req.file.buffer,
      "fishtail-products"
    );

    // Create product
    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      imageUrl: cloudinaryResult.secure_url,
      cloudinaryId: cloudinaryResult.public_id,
    });

    await product.save();

    res
      .status(201)
      .json(formatSuccessResponse(product, "Product created successfully"));
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json(
          formatErrorResponse(
            "Product with this name already exists",
            "DUPLICATE_PRODUCT"
          )
        );
    }

    res.status(500).json(formatErrorResponse("Error creating product"));
  }
};

// update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json(
          formatErrorResponse("Invalid product ID format", "VALIDATION_ERROR")
        );
    }

    const { name, description, category } = req.body;

    // DEBUG: Log what's being received
    console.log("📝 Received update data:", { name, description, category });

    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json(formatErrorResponse("Product not found", "NOT_FOUND"));
    }

    const updates = {};

    // Update name if provided
    if (name) {
      if (name.trim().length < 2) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              "Product name must be at least 2 characters long",
              "VALIDATION_ERROR"
            )
          );
      }

      // Check for duplicate product name (excluding current product)
      const existingProduct = await Product.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
        _id: { $ne: id },
      });

      if (existingProduct) {
        return res
          .status(409)
          .json(
            formatErrorResponse(
              "Product with this name already exists",
              "DUPLICATE_PRODUCT"
            )
          );
      }

      updates.name = name.trim();
    }

    // Update description if provided
    if (description !== undefined) {
      updates.description = description.trim();
    }

    // ✅ ADD THIS: Update category if provided
    if (category) {
      // Validate category against your allowed categories
      const allowedCategories = [
        "Geological & Survey Equipment",
        "Laboratory Testing Equipment",
        "Construction & Civil Engineering Tools",
        "Fire Safety Tools",
        "Safety and Rescue Equipment",
        "Trekking & Outdoor Gears",
      ];

      if (!allowedCategories.includes(category)) {
        return res
          .status(400)
          .json(
            formatErrorResponse("Invalid product category", "VALIDATION_ERROR")
          );
      }

      updates.category = category;
    }

    // If new image uploaded
    if (req.file) {
      // Delete old image from Cloudinary
      await deleteFromCloudinary(product.cloudinaryId);

      // Upload new image
      const cloudinaryResult = await uploadToCloudinary(
        req.file.buffer,
        "fishtail-products"
      );
      updates.imageUrl = cloudinaryResult.secure_url;
      updates.cloudinaryId = cloudinaryResult.public_id;
    }

    // DEBUG: Log what will be updated
    console.log("🔄 Updates to apply:", updates);

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-__v");

    // DEBUG: Log the final result
    console.log("✅ Final updated product:", updatedProduct);

    res.json(
      formatSuccessResponse(updatedProduct, "Product updated successfully")
    );
  } catch (error) {
    console.error("💥 Update product error:", error);

    if (error.code === 11000) {
      return res
        .status(409)
        .json(
          formatErrorResponse(
            "Product with this name already exists",
            "DUPLICATE_PRODUCT"
          )
        );
    }

    res.status(500).json(formatErrorResponse("Error updating product"));
  }
};

// delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json(
          formatErrorResponse("Invalid product ID format", "VALIDATION_ERROR")
        );
    }

    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json(formatErrorResponse("Product not found", "NOT_FOUND"));
    }

    // Delete image from Cloudinary
    await deleteFromCloudinary(product.cloudinaryId);

    // Delete from database
    await Product.findByIdAndDelete(id);

    res.json(formatSuccessResponse(null, "Product deleted successfully"));
  } catch (error) {
    res.status(500).json(formatErrorResponse("Error deleting product"));
  }
};

// Get product statistics
export const getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();

    // Get product count per category
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(
      formatSuccessResponse({
        totalProducts,
        totalCategories: categoryStats.length,
        categoryStats,
        largestCategory:
          categoryStats.length > 0 ? categoryStats[0]._id : "N/A",
        largestCategoryCount:
          categoryStats.length > 0 ? categoryStats[0].count : 0,
      })
    );
  } catch (error) {
    res
      .status(500)
      .json(formatErrorResponse("Error fetching product statistics"));
  }
};

/* // Export products to CSV
export const exportProducts = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = {};
    if (category && category !== "all") {
      filter.category = category;
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .select("name description category createdAt")
      .lean();

    // Convert to CSV
    const csvHeader = "Name,Description,Category,Created At\n";
    const csvRows = products
      .map(
        (product) =>
          `"${product.name.replace(/"/g, '""')}","${product.description.replace(
            /"/g,
            '""'
          )}","${product.category}","${new Date(
            product.createdAt
          ).toISOString()}"`
      )
      .join("\n");

    const csv = csvHeader + csvRows;

    await auditLog(
      "PRODUCTS_EXPORTED",
      req.authUser.id,
      "Product",
      { count: products.length, category },
      req.ip,
      req.get("User-Agent")
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=products-${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    res.send(csv);
  } catch (error) {
    console.error("Export products error:", error);
    await auditLog(
      "PRODUCTS_EXPORT_ERROR",
      req.authUser.id,
      "Product",
      { error: error.message },
      req.ip,
      req.get("User-Agent")
    );
    res.status(500).json(formatErrorResponse("Error exporting products"));
  }
};

// Backup database
export const backupData = async (req, res) => {
  try {
    const [products, auditLogs] = await Promise.all([
      Product.find().lean(),
      // AuditLog.find().limit(1000).lean(), // Limit logs to prevent huge backups
    ]);

    const backup = {
      timestamp: new Date().toISOString(),
      products,
      auditLogs,
      backupId: require("crypto").randomBytes(16).toString("hex"),
    };

    await auditLog(
      "BACKUP_CREATED",
      req.authUser.id,
      "System",
      { productCount: products.length, logCount: auditLogs.length },
      req.ip,
      req.get("User-Agent")
    );

    res.json(
      formatSuccessResponse(
        {
          backupId: backup.backupId,
          timestamp: backup.timestamp,
          productCount: products.length,
          logCount: auditLogs.length,
        },
        "Backup created successfully"
      )
    );
  } catch (error) {
    console.error("Backup error:", error);
    await auditLog(
      "BACKUP_ERROR",
      req.authUser.id,
      "System",
      { error: error.message },
      req.ip,
      req.get("User-Agent")
    );
    res.status(500).json(formatErrorResponse("Error creating backup"));
  }
};
 */
