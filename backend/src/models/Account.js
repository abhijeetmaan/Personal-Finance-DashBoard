import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
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
      maxlength: 120,
    },
    type: {
      type: String,
      enum: ["bank", "wallet", "investment"],
      default: "bank",
      index: true,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
      maxlength: 8,
    },
    color: {
      type: String,
      default: "",
      trim: true,
      maxlength: 32,
    },
    icon: {
      type: String,
      default: "",
      trim: true,
      maxlength: 32,
    },
    balance: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

accountSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Account = mongoose.model("Account", accountSchema);
