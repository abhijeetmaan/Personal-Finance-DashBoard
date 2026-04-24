import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ["warning", "info"],
      required: true,
      default: "info",
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

alertSchema.index({ userId: 1, createdAt: -1 });

export const Alert = mongoose.model("Alert", alertSchema);
