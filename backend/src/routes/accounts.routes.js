import { Router } from "express";
import {
  createAccount,
  deleteAccount,
  getAccounts,
  getAccountsSummary,
  transferBetweenAccounts,
} from "../controllers/accounts.controller.js";

const router = Router();

router.get("/summary", getAccountsSummary);
router.post("/transfer", transferBetweenAccounts);
router.route("/").post(createAccount).get(getAccounts);
router.patch("/:id/delete", deleteAccount);

export default router;
