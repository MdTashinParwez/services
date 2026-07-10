import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getProviderBookings,
  acceptBooking,
  rejectBooking,
  startBooking,
  completeBooking,
} from "../controllers/booking.controller.js";

const router = Router();

// Customer Routes
router.route("/")
  .post(verifyJWT, createBooking);

router.route("/my-bookings")
  .get(verifyJWT, getMyBookings);

router.route("/:id")
  .get(verifyJWT, getBookingById);

router.route("/:id/cancel")
  .patch(verifyJWT, cancelBooking);

// Provider Routes
router.route("/provider")
  .get(verifyJWT, getProviderBookings);

router.route("/:id/accept")
  .patch(verifyJWT, acceptBooking);

router.route("/:id/reject")
  .patch(verifyJWT, rejectBooking);

router.route("/:id/start")
  .patch(verifyJWT, startBooking);

router.route("/:id/complete")
  .patch(verifyJWT, completeBooking);

export default router;