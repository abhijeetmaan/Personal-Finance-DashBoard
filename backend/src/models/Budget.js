import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
      default: null,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    monthlyBudget: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

budgetSchema.index(
  { userId: 1, category: 1, month: 1, year: 1 },
  { unique: true },
);

budgetSchema.virtual("totalAmount").get(function totalAmountGetter() {
  return this.monthlyBudget;
});

export const Budget = mongoose.model("Budget", budgetSchema);
