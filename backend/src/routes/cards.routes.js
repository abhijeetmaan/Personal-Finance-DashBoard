import { Router } from "express";
import {
  createCard,
  deleteCard,
  getCardBill,
  getCards,
  payCardBill,
} from "../controllers/cards.controller.js";

const router = Router();

router.route("/").post(createCard).get(getCards);
router.route("/pay-bill").post(payCardBill);
router.get("/:id/bill", getCardBill);
router.patch("/:id/delete", deleteCard);

export default router;
