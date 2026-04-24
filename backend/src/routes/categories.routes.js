import { Router } from "express";
import {
  createCategory,
  getCategories,
  removeCategory,
} from "../controllers/categories.controller.js";

const router = Router();

router.route("/").get(getCategories).post(createCategory);
router.route("/:id").delete(removeCategory);

export default router;
