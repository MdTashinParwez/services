import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
  createPayment,
  paymentSuccess,
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

router.route("/:id/success")
  .patch(verifyJWT, paymentSuccess);

export default router;