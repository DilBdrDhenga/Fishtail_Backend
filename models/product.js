import { model, Schema } from "mongoose";

const ProductSchema = Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Product name cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    cloudinaryId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
ProductSchema.index({ category: 1, createdAt: -1 });
ProductSchema.index({ name: "text", description: "text" });

// Transform output
ProductSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Product = model("Product", ProductSchema);
export default Product;
