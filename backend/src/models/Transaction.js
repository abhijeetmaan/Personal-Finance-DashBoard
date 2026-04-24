import mongoose from "mongoose";

const recurringPatternSchema = new mongoose.Schema(
  {
    frequency: {
      type: String,
      enum: ["weekly", "monthly", "yearly", null],
      default: null,
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      default: null,
    },
  },
  { _id: false },
);

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
      index: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: false,
      index: true,
      default: null,
    },
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      required: false,
      index: true,
      default: null,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    source: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: recurringPatternSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1, date: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);
