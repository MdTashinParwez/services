import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
  createReview,
  getMyReviews,
  getReviewById,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";

const router = Router();

router.route("/")
  .post(verifyJWT, createReview);

router.route("/my-reviews")
  .get(verifyJWT, getMyReviews);

router.route("/:id")
  .get(verifyJWT, getReviewById)
  .patch(verifyJWT, updateReview)
  .delete(verifyJWT, deleteReview);

export default router;