import { Router } from "express";
import redisClient from "../utils/redis.js";

const router = Router();

router.get("/", async (req, res) => {
    try {
        await redisClient.ping();

        res.status(200).json({
            success: true,
            database: "connected",
            redis: "connected",
            server: "healthy",
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            database: "connected",
            redis: "disconnected",
            server: "unhealthy",
        });
    }
});

export default router;