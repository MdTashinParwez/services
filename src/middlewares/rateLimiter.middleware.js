import redisClient from "../utils/redis.js";

const rateLimiter = ({
    keyPrefix,
    limit,
    windowInSeconds,
}) => {
    return async (req, res, next) => {
        try {
            const clientIp = req.ip;

            const key = `${keyPrefix}:${clientIp}`;

            const currentCount = await redisClient.incr(key);

            if (currentCount === 1) {
                await redisClient.expire(key, windowInSeconds);
            }

            if (currentCount > limit) {
                return res.status(429).json({
                    success: false,
                    statusCode: 429,
                    message: "Too many requests. Please try again later.",
                });
            }

            next();
        } catch (error) {
            console.error("Rate limiter error:", error);

            // Redis fail hone par API ko block nahi karenge
            next();
        }
    };
};

export default rateLimiter;