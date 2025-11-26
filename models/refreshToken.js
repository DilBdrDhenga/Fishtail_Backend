import mongoose, { model, Schema } from "mongoose";

const refreshTokenSchema = Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  ip: {
    type: String,
    required: true,
  },
  userAgent: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7 * 24 * 60 * 60, // Auto-delete after 7 days (in seconds)
  },
});

// Create TTL index for automatic expiration
refreshTokenSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 }
);
refreshTokenSchema.index({ adminId: 1 });

const RefreshToken = model("RefreshToken", refreshTokenSchema);
export default RefreshToken;
