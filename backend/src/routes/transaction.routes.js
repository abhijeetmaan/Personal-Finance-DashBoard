import { Router } from "express";
import {
  createTransaction,
  deleteTransaction,
  exportTransactionsCsv,
  getTransactionById,
  getTransactions,
  updateTransaction,
} from "../controllers/transaction.controller.js";

const router = Router();

router.get("/export", exportTransactionsCsv);
router.route("/").post(createTransaction).get(getTransactions);
router
  .route("/:id")
  .get(getTransactionById)
  .put(updateTransaction)
  .delete(deleteTransaction);

export default router;
