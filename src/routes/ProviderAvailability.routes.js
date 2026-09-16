import { Router } from "express";

import {
  createProviderAvailability,
  getProviderAvailability,
  updateProviderAvailability,
  deleteProviderAvailability,getAvailableSlots
} from "../controllers/ProviderAvailability.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/")
  .post(createProviderAvailability)
  .get(getProviderAvailability);

router
  .route("/:availabilityId")
  .patch(updateProviderAvailability)
  .delete(deleteProviderAvailability);

router.get(
  "/slots",
  getAvailableSlots
);

export default router;