import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
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
      enum: ["credit", "debit"],
      default: "credit",
      index: true,
    },
    limit: {
      type: Number,
      default: 0,
    },
    usedAmount: {
      type: Number,
      default: 0,
    },
    billingCycleStart: {
      type: Number,
      min: 1,
      max: 31,
      default: 1,
    },
    dueDate: {
      type: Number,
      min: 1,
      max: 31,
      default: 1,
    },
    linkedAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: false,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    icon: {
      type: String,
      default: "",
      trim: true,
      maxlength: 32,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

cardSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Card = mongoose.model("Card", cardSchema);
