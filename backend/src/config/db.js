import mongoose from "mongoose";
import { env } from "./env.js";
import { Budget } from "../models/Budget.js";
import { Category } from "../models/Category.js";
import { LedgerEntry } from "../models/LedgerEntry.js";
import { backfillLedgerFromAllTransactions } from "../services/ledger.service.js";

/** Log URI without credentials (for Render logs). */
function describeMongoUri(uri) {
  if (!uri) return "(missing)";
  return uri.replace(/\/\/([^@]+)@/, "//***:***@");
}

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
    console.log("Connecting to MongoDB...", describeMongoUri(env.mongoUri));
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 25_000,
      maxPoolSize: 10,
    });
    await migrateBudgetCollection();
    await maybeBackfillLedger();
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed.");
    console.error("URI (redacted):", describeMongoUri(env.mongoUri));
    console.error("Error:", error.message);
    if (error.reason) console.error("Reason:", String(error.reason));
    console.error(
      "Fix: In MongoDB Atlas → Network Access, allow 0.0.0.0/0 (or Render outbound IPs). Confirm user/password and database name in the connection string. Use env name MONGO_URI or MONGODB_URI on Render.",
    );
    process.exit(1);
  }
};

export default connectDB;
