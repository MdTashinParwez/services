import { Worker } from "bullmq";

import sendEmail from "../utils/sendEmail.js";

import {
    welcomeEmail,
} from "../emails/auth/authEmail.js";

import { Booking } from "../models/booking.model.js";

import {
    bookingCreatedEmail,
    bookingAcceptedEmail,
    bookingRejectedEmail,
    bookingCancelledEmail,
    bookingCompletedEmail,
} from "../emails/booking/bookingEmails.js";


const notificationWorker = new Worker(

    "notification-queue",

    async (job) => {

        console.log("JOB RECEIVED");  // testing
        console.log("Job name:", job.name);  // testing


        if (job.name === "welcome-email") {

            const { email, username } = job.data;

            const html = welcomeEmail({
                username,
            });

            await sendEmail({
                to: email,
                subject: "Welcome to ServiceHub",
                html,
            });

            console.log("Welcome email sent successfully"); // testing
        }

        if (job.name === "booking-created-email") {

            const { bookingId } = job.data;

            const booking = await Booking.findById(bookingId)
                .populate("service", "title price")
                .populate("customer", "username email")
                .populate({
                    path: "provider",
                    select: "businessName user",
                    populate: {
                        path: "user",
                        select: "email",
                    },
                });

            if (!booking) {
                throw new Error("Booking not found");
            }

            const html = bookingCreatedEmail({
                providerName: booking.provider.businessName,
                customerName: booking.customer.username,
                serviceTitle: booking.service.title,
                bookingDate: booking.bookingDate.toLocaleDateString(),
                startTime: booking.startTime.toLocaleTimeString(),
                endTime: booking.endTime.toLocaleTimeString(),
                totalAmount: booking.totalAmount,
                bookingUrl: `http://localhost:5173/bookings/${booking._id}`,
            });

            await sendEmail({
                // to: booking.provider.user.email,
                to: "secondaryt25@gmail.com", // testing
                subject: "New Booking Request - ServiceHub",
                html,
            });

            console.log("Booking created email sent successfully");   // testing
        }

        if (job.name === "booking-accepted-email") {

            const { bookingId } = job.data;

            const booking = await Booking.findById(bookingId)
                .populate("service", "title price")
                .populate("customer", "username email")
                .populate("provider", "businessName");

            if (!booking) {
                throw new Error("Booking not found");
            }

            const html = bookingAcceptedEmail({
                providerName: booking.provider.businessName,
                customerName: booking.customer.username,
                serviceTitle: booking.service.title,
                bookingDate: booking.bookingDate.toLocaleDateString(),
                startTime: booking.startTime.toLocaleTimeString(),
                endTime: booking.endTime.toLocaleTimeString(),
                totalAmount: booking.totalAmount,
                bookingUrl: `http://localhost:5173/bookings/${booking._id}`,
            });

            await sendEmail({
                // to: booking.customer.email,
                to: "secondaryt25@gmail.com", // testing
                subject: "Booking Confirmed - ServiceHub",
                html,
            });

            console.log("Booking accepted email sent successfully");  // testing
        }


        if (job.name === "booking-rejected-email") {

            const { bookingId } = job.data;

            const booking = await Booking.findById(bookingId)
                .populate("service", "title price")
                .populate("customer", "username email")
                .populate("provider", "businessName");

            if (!booking) {
                throw new Error("Booking not found");
            }

            const html = bookingRejectedEmail({
                providerName: booking.provider.businessName,
                customerName: booking.customer.username,
                serviceTitle: booking.service.title,
                bookingDate: booking.bookingDate.toLocaleDateString(),
                startTime: booking.startTime.toLocaleTimeString(),
                endTime: booking.endTime.toLocaleTimeString(),
                totalAmount: booking.totalAmount,
                cancellationReason: booking.cancellationReason,
                bookingUrl: `http://localhost:5173/bookings/${booking._id}`,
            });

            await sendEmail({
                // to: booking.customer.email,
                to: "secondaryt25@gmail.com", // testing
                subject: "Booking Request Rejected - ServiceHub",
                html,
            });

            console.log("Booking rejected email sent successfully");  // testing
        }


        if (job.name === "booking-cancelled-email") {

            const { bookingId } = job.data;

            const booking = await Booking.findById(bookingId)
                .populate("service", "title price")
                .populate("customer", "username email")
                .populate({
                    path: "provider",
                    select: "businessName user",
                    populate: {
                        path: "user",
                        select: "email",
                    },
                });

            if (!booking) {
                throw new Error("Booking not found");
            }


            const html = bookingCancelledEmail({
                providerName: booking.provider.businessName,
                customerName: booking.customer.username,
                serviceTitle: booking.service.title,
                bookingDate: booking.bookingDate.toLocaleDateString(),
                startTime: booking.startTime.toLocaleTimeString(),
                endTime: booking.endTime.toLocaleTimeString(),
                totalAmount: booking.totalAmount,
                cancellationReason: booking.cancellationReason,
                bookingUrl: `http://localhost:5173/bookings/${booking._id}`,
            });


            // Customer cancelled → provider receives email
            if (booking.cancelledBy === "customer") {

                await sendEmail({
                    // to: booking.provider.user.email,
                    to: "secondaryt25@gmail.com", // testing
                    subject: "Booking Cancelled - ServiceHub",
                    html,
                });

            }

            // Provider cancelled → customer receives email
            if (booking.cancelledBy === "provider") {

                await sendEmail({
                    // to: booking.customer.email,
                    to: "secondaryt25@gmail.com", // testing
                    subject: "Booking Cancelled - ServiceHub",
                    html,
                });

            }

            console.log("Booking cancelled email sent successfully");
        }


        if (job.name === "booking-completed-email") {

            const { bookingId } = job.data;

            const booking = await Booking.findById(bookingId)
                .populate("service", "title price")
                .populate("customer", "username email")
                .populate("provider", "businessName");

            if (!booking) {
                throw new Error("Booking not found");
            }

            const html = bookingCompletedEmail({
                providerName: booking.provider.businessName,
                customerName: booking.customer.username,
                serviceTitle: booking.service.title,
                bookingDate: booking.bookingDate.toLocaleDateString(),
                startTime: booking.startTime.toLocaleTimeString(),
                endTime: booking.endTime.toLocaleTimeString(),
                totalAmount: booking.totalAmount,
                bookingUrl: `http://localhost:5173/bookings/${booking._id}`,
            });

            await sendEmail({
                // to: booking.customer.email,
                to: "secondaryt25@gmail.com", // testing
                subject: "Booking Completed - ServiceHub",
                html,
            });

            console.log("Booking completed email sent successfully");   // testing
        }

    },

    {
        connection: {
            host: "localhost",
            port: 6379,
        },
    }
);


// WORKER EVENTS


notificationWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
});


notificationWorker.on("failed", (job, error) => {
    console.error(
        `Job ${job?.id} failed:`,
        error.message
    );
});