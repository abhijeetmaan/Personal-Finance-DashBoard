import mongoose from "mongoose";

const ledgerEntrySchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    /** Bank / wallet / investment account (null = nominal P&L leg). */
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
      index: true,
    },
    /** Credit card liability leg (null when not applicable). */
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      default: null,
      index: true,
    },
    /** Accounting side: debit or credit. */
    entryType: {
      type: String,
      enum: ["debit", "credit"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    /** Mirrors transaction date for reporting. */
    postedAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

ledgerEntrySchema.index({ userId: 1, postedAt: -1 });
ledgerEntrySchema.index({ userId: 1, accountId: 1, postedAt: -1 });
ledgerEntrySchema.index({ userId: 1, cardId: 1, postedAt: -1 });

export const LedgerEntry = mongoose.model("LedgerEntry", ledgerEntrySchema);
