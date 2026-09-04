import { Router } from "express";
import notificationQueue from "../queues/notification.queue.js";

const router = Router();

router.get("/queue-test", async (req, res) => {

  await notificationQueue.add(
    "booking-reminder",
    {
        bookingId: "12345",
        message: "Booking reminder"
    },
    {
        delay: 10000
    }
);

    return res.status(200).json({
        success: true,
        message: "Job added to notification queue"
    });
});

export default router;