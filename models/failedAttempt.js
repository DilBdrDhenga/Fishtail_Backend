import { model, Schema } from "mongoose";

const failedAttemptSchema = Schema({
  ip: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 1,
  },
  lastAttempt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 15 * 60, // Auto-delete after 15 minutes (in seconds)
  },
});

// Create TTL index for automatic expiration
failedAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15 * 60 });

const FailedAttempt = model("FailedAttempt", failedAttemptSchema);
export default FailedAttempt;
