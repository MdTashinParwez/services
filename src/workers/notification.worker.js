import { Worker } from "bullmq";

const notificationWorker = new Worker(
  "notification-queue",
  async (job) => {

    console.log("JOB RECEIVED");
    console.log("Job name:", job.name);
    console.log("Job data:", job.data);

    // Abhi sirf testing ke liye
    console.log("Processing notification job...");
    if (job.attemptsMade < 2) {
    throw new Error("Temporary failure");
}

console.log("Notification processed successfully");

  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);

notificationWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

notificationWorker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});