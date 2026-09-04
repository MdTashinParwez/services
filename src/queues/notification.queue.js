import { Queue } from "bullmq";

const notificationQueue = new Queue("notification-queue", {
  connection: {
    host: "localhost",
    port: 6379,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "fixed",
      delay: 2000,
    },
  },
});

export default notificationQueue;