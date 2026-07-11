import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
  getMyNotifications,
  getNotificationById,
  markAsRead,
  // deleteNotification,
} from "../controllers/notification.controller.js";

const router = Router();

router.route("/")
.get(verifyJWT, getMyNotifications);

router.route("/:id")
.get(verifyJWT, getNotificationById)
// .delete(verifyJWT, deleteNotification);

router.route("/:id/read")
.patch(verifyJWT, markAsRead);

export default router;