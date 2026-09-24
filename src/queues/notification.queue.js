// import { Queue } from "bullmq";

// const notificationQueue = new Queue("notification-queue", {
//   connection: {
//      url: process.env.REDIS_URL || "redis://localhost:6379",
//   },
//   defaultJobOptions: {
//     attempts: 3,
//     backoff: {
//       type: "fixed",
//       delay: 2000,
//     },
//   },
// });

// export default notificationQueue;

import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisConnection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

const notificationQueue = new Queue("notification-queue", {
  connection: redisConnection,

  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "fixed",
      delay: 2000,
    },
  },
});

export default notificationQueue;