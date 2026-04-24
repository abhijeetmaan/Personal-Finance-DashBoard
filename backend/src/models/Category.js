import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      default: "expense",
      index: true,
    },
    icon: {
      type: String,
      trim: true,
      maxlength: 32,
      default: "💰",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export const Category = mongoose.model("Category", categorySchema);
