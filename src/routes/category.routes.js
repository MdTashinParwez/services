import { Router } from "express";

import {
  createCategory,
  getAllCategories,
} from "../controllers/category.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


// Public/Provider side
router
  .route("/")
  .get(getAllCategories);


// Admin
router
  .route("/")
  .post(
    verifyJWT,
    createCategory
  );


export default router;