import mongoose from "mongoose";
import { apiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Booking } from "../models/booking.model.js";
import { Payment } from "../models/payment.model.js";
import asyncHandler from '../utils/asyncHandler.js';

const createPayment = asyncHandler(async (req,res) => {
     
    // validation 
    if(!req.user._id){
        throw new apiError(401,"Unauthorized Access");
    }
    const { bookingId, paymentMethod } = req.body;

    if (!bookingId || !paymentMethod){
    throw new apiError( 400,"Booking id and payment method are required" );
    }
    if (!mongoose.isValidObjectId(bookingId)) {
        throw new apiError(400, "Invalid booking id");
    }
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new apiError(404, "Booking not found");
    }

    if (booking.customer.toString() !== req.user._id.toString()) {
    throw new apiError(
      403,
      "You are not allowed to pay for this booking"
    );
  }

  if (booking.status === "cancelled") {
    throw new apiError(
      400,
      "Cancelled booking cannot be paid"
    );
  }

  if (booking.paymentStatus === "completed") {
    throw new apiError(
      400,
      "Payment already completed"
    );
  }
   const allowedMethods = [
    "stripe",
    "razorpay",
    "wallet",
    "credit_card",
    "debit_card",
    "upi",
  ];

  if (!allowedMethods.includes(paymentMethod)) {
    throw new apiError(400, "Invalid payment method");
  }

  //  duplicate pending payment
  const existingPayment = await Payment.findOne({
    booking: booking._id,
    paymentStatus: "pending",
  });

  if (existingPayment) {
    throw new apiError(
      400,
      "A pending payment already exists for this booking"
    );
  }
   const payment = await Payment.create({
    booking: booking._id,
    customer: booking.customer,
    provider: booking.provider,
    amount: booking.totalAmount,
    paymentMethod,
    paymentStatus: "pending",
    description: `Payment for booking #${booking._id}`,
  });

  booking.paymentId = payment._id;

  await booking.save();

  const createdPayment = await Payment.findById(payment._id)
    .populate("booking")
    .populate("customer", "fullName email")
    .populate("provider", "businessName");

  return res.status(201).json(
    new ApiResponse(
      201,
      createdPayment,
      "Payment created successfully"
    )
  );

})

const paymentSuccess = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const { id } = req.params;
  const { transactionId } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid payment id");
  }

  const payment = await Payment.findById(id);

  if (!payment) {
    throw new apiError(404, "Payment not found");
  }

  // Customer ownership
  if (payment.customer.toString() !== req.user._id.toString()) {
    throw new apiError(
      403,
      "You are not allowed to update this payment"
    );
  }

  if (payment.paymentStatus === "completed") {
    throw new apiError(400, "Payment already completed");
  }

  if (payment.paymentStatus === "refunded") {
    throw new apiError(400, "Payment already refunded");
  }

  if (payment.paymentStatus === "cancelled") {
    throw new apiError(400, "Payment was cancelled");
  }

  if (!transactionId?.trim()) {
    throw new apiError(400, "Transaction id is required");
  }

  // Update payment
  payment.paymentStatus = "completed";
  payment.transactionId = transactionId;

  await payment.save();

  // Update booking
  await Booking.findByIdAndUpdate(
    payment.booking,
    {
      paymentStatus: "completed",
      paymentId: payment._id,
    },
    {
      new: true,
    }
  );

  const updatedPayment = await Payment.findById(payment._id)
    .populate("booking")
    .populate("customer", "fullName email")
    .populate("provider", "businessName");

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedPayment,
      "Payment completed successfully"
    )
  );
});

const getMyPayments = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 20);
  const skip = (page - 1) * limit;

  const totalPayments = await Payment.countDocuments({
    customer: req.user._id,
  });

  const payments = await Payment.find({
    customer: req.user._id,
  })
    .populate("booking")
    .populate("provider", "businessName isVerified")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        payments,
        currentPage: page,
        totalPages: Math.ceil(totalPayments / limit),
        totalPayments,
      },
      "Payments fetched successfully"
    )
  );
});

const getPaymentById = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid payment id");
  }

  const payment = await Payment.findById(id)
    .populate({
      path: "booking",
      populate: {
        path: "service",
        select: "title price",
      },
    })
    .populate("customer", "fullName email")
    .populate("provider", "businessName isVerified");

  if (!payment) {
    throw new apiError(404, "Payment not found");
  }

  if (payment.customer.toString() !== req.user._id.toString()) {
    throw new apiError(
      403,
      "You are not allowed to access this payment"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      payment,
      "Payment fetched successfully"
    )
  );
});

export {
  createPayment,
  paymentSuccess,
  getMyPayments,
  getPaymentById,
};