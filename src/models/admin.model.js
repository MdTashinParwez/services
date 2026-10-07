import mongoose, { Schema } from "mongoose";

const adminLogSchema = new Schema(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["Provider", "User", "Service", "Category", "Booking", "Payment", "System"],
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    reason: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ targetType: 1, targetId: 1 });

export const AdminLog = mongoose.model("AdminLog", adminLogSchema);
