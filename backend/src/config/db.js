import mongoose from "mongoose";
import { Budget } from "../models/Budget.js";
import { Category } from "../models/Category.js";
import { LedgerEntry } from "../models/LedgerEntry.js";
import { backfillLedgerFromAllTransactions } from "../services/ledger.service.js";

const migrateBudgetCollection = async () => {
  try {
    await Budget.deleteMany({
      $or: [
        { category: { $exists: false } },
        { category: null },
        { category: "" },
      ],
    });

    const escapeRegExp = (value) =>
      String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const orphanBudgets = await Budget.find({}).select("_id userId category").lean();
    for (const doc of orphanBudgets) {
      const raw = String(doc.category || "").trim();
      if (!raw) {
        await Budget.deleteOne({ _id: doc._id });
        continue;
      }
      const exists = await Category.exists({
        userId: doc.userId ?? null,
        name: new RegExp(`^${escapeRegExp(raw)}$`, "i"),
      });
      if (!exists) {
        await Budget.deleteOne({ _id: doc._id });
      }
    }

    const indexes = await Budget.collection.indexes();
    const legacyIndexExists = indexes.some(
      (index) => index.name === "userId_1_month_1_year_1",
    );

    if (legacyIndexExists) {
      await Budget.collection.dropIndex("userId_1_month_1_year_1");
      console.log("Dropped legacy budget index userId_1_month_1_year_1");
    }

    await Budget.syncIndexes();
  } catch (error) {
    console.warn("Budget collection migration skipped:", error.message);
  }
};

const maybeBackfillLedger = async () => {
  try {
    const count = await LedgerEntry.countDocuments();
    if (count === 0) {
      await backfillLedgerFromAllTransactions();
      console.log("Ledger backfilled from transactions (double-entry)");
    }
  } catch (error) {
    console.warn("Ledger backfill skipped:", error.message);
  }
};

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    console.log("Connecting to MongoDB...");
    mongoose.set("strictQuery", true);
    await mongoose.connect(process.env.MONGO_URI);
    await migrateBudgetCollection();
    await maybeBackfillLedger();
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
