import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  getProductsByCategory,
  getProductStats,
  updateProduct,
} from "../controllers/productController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { productLimiter } from "../middleware/rateLimiter.js";
import { handleUploadErrors, upload } from "../middleware/uploadMiddleware.js";
import {
  handleValidationErrors,
  validateProductCreate,
  validateProductId,
  validateProductUpdate,
} from "../middleware/validationMiddleware.js";

const productRouter = Router();
productRouter.use(productLimiter);

//  PUBLIC ROUTES
productRouter.route("/public").get(getProducts);
productRouter.route("/public/stats").get(getProductStats);
productRouter.route("/public/category/:category").get(getProductsByCategory);
productRouter
  .route("/public/:id")
  .get(validateProductId, handleValidationErrors, getProduct);

//  PROTECTED ROUTES
productRouter.use(authenticateToken);

// Admin product management
productRouter.route("/").get(getProducts);
productRouter.route("/stats").get(getProductStats);

productRouter
  .route("/")
  .post(
    upload.single("image"),
    handleUploadErrors,
    validateProductCreate,
    handleValidationErrors,
    createProduct
  );

productRouter
  .route("/:id")
  .get(validateProductId, handleValidationErrors, getProduct)
  .patch(
    upload.single("image"),
    handleUploadErrors,
    validateProductId,
    validateProductUpdate,
    handleValidationErrors,
    updateProduct
  )
  .delete(validateProductId, handleValidationErrors, deleteProduct);

// Export and backup routes
/* productRouter.route("/export/csv").get(exportProducts);
productRouter.route("/backup").get(backupData); */

export default productRouter;
