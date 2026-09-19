import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
  createPayment,
  verifyPayment,
  markPaymentFailed,
  getMyPayments,
  getPaymentById,
} from "../controllers/payment.controller.js";

const router = Router();


router.route("/")
  .post(verifyJWT, createPayment);

router.route("/my-payments")
  .get(verifyJWT, getMyPayments);

router.route("/:id")
  .get(verifyJWT, getPaymentById);

router.route("/:id/verify")    // payment id 
  .patch(verifyJWT, verifyPayment);

router.route("/:id/failed")
  .patch(verifyJWT, markPaymentFailed);

export default router;