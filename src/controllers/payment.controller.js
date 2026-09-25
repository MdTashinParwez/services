import mongoose from "mongoose";
import { apiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Booking } from "../models/booking.model.js";
import { Payment } from "../models/payment.model.js";
import asyncHandler from '../utils/asyncHandler.js';
import razorpay from "../utils/razorpay.js";
import crypto from "crypto";

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
  const razorpayOrder = await razorpay.orders.fetch(
    existingPayment.orderId
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        payment: existingPayment,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
        keyId: process.env.RAZORPAY_KEY_ID,
      },
      "Existing payment order retrieved successfully"
    )
  );
}

  // Razorpay payment creation
  const amountInPaise = Math.round(booking.totalAmount * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: booking.currency || "INR",
    receipt: `booking_${booking._id}`,
    notes: {
      bookingId: booking._id.toString(),
      customerId: booking.customer.toString(),
    },
  });


  const payment = await Payment.create({
  booking: booking._id,
  customer: booking.customer,
  provider: booking.provider,
  amount: booking.totalAmount,
  currency: booking.currency || "INR",
  paymentMethod,
  paymentStatus: "pending",
  orderId: razorpayOrder.id,
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
    {
      payment: createdPayment,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    },
    "Payment order created successfully"
  )
);

})
const verifyPayment = asyncHandler(async (req, res) => {

  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
  } = req.body || {};

  // Validate Razorpay response
  if (
    !razorpay_payment_id ||
    !razorpay_order_id ||
    !razorpay_signature
  ) {
    throw new apiError(
      400,
      "Razorpay payment details are required"
    );
  }

  const {id} = req.params;

  if (!mongoose.isValidObjectId(id)) {
  throw new apiError(400, "Invalid payment id");
}

  // Find our payment record
 const payment = await Payment.findById(id);

  if (!payment) {
    throw new apiError(
      404,
      "Payment record not found"
    );
  }
  if (payment.orderId !== razorpay_order_id) {
  throw new apiError(
    400,
    "Payment order does not match"
  );
}

  // Customer ownership
  if (
    payment.customer.toString() !==
    req.user._id.toString()
  ) {
    throw new apiError(
      403,
      "You are not allowed to verify this payment"
    );
  }


  // Generate expected signature
  const generatedSignature = crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET
    )
    .update(
      `${razorpay_order_id}|${razorpay_payment_id}`
    )
    .digest("hex");

  // Compare signatures
  if (generatedSignature !== razorpay_signature) {
    throw new apiError(
      400,
      "Invalid payment signature"
    );
  }

    // Already completed
  if (payment.paymentStatus === "completed") {
    return res.status(200).json(
      new ApiResponse(
        200,
        payment,
        "Payment already verified"
      )
    );
  }


  // Payment verified
 const session = await mongoose.startSession();

try {
  session.startTransaction();

  payment.paymentStatus = "completed";
  payment.transactionId = razorpay_payment_id;

  await payment.save({ session });

  const booking = await Booking.findByIdAndUpdate(
    payment.booking,
    {
      paymentStatus: "completed",
      paymentId: payment._id,
    },
    {
      new: true,
      session,
    }
  );

  if (!booking) {
    throw new apiError(404, "Booking not found");
  }

  await session.commitTransaction();

  const updatedPayment = await Payment.findById(
    payment._id
  )
    .populate("booking")
    .populate("customer", "fullName email")
    .populate("provider", "businessName");

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedPayment,
      "Payment verified successfully"
    )
  );

} catch (error) {

  await session.abortTransaction();
  throw error;

} finally {

  await session.endSession();

}
});

const markPaymentFailed = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const { id } = req.params;
  const { razorpay_order_id, reason } = req.body || {};

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid payment id");
  }

  if (!razorpay_order_id) {
    throw new apiError(400, "Razorpay order id is required");
  }

  const payment = await Payment.findById(id);

  if (!payment) {
    throw new apiError(404, "Payment record not found");
  }

  if (
    payment.customer.toString() !==
    req.user._id.toString()
  ) {
    throw new apiError(
      403,
      "You are not allowed to update this payment"
    );
  }

  if (payment.orderId !== razorpay_order_id) {
    throw new apiError(
      400,
      "Payment order does not match"
    );
  }

  if (payment.paymentStatus === "completed") {
    throw new apiError(
      400,
      "Completed payment cannot be marked as failed"
    );
  }

  payment.paymentStatus = "failed";
  payment.failureReason =
    reason || "Payment failed";

  await payment.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      payment,
      "Payment marked as failed"
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

  if (payment.customer._id.toString() !== req.user._id.toString()) {
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

const razorpayWebhook = asyncHandler(async (req, res) => {
  const webhookSignature = req.headers["x-razorpay-signature"];

  if (!webhookSignature) {
    throw new apiError(400, "Webhook signature missing");
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new apiError(500, "Razorpay webhook secret is not configured");
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.body)
    .digest("hex");

  if (expectedSignature !== webhookSignature) {
    throw new apiError(400, "Invalid webhook signature");
  }

  const event = JSON.parse(req.body.toString());

  switch (event.event) {
    case "payment.captured": {
      const paymentEntity = event.payload.payment.entity;

      const razorpayPaymentId = paymentEntity.id;
      const razorpayOrderId = paymentEntity.order_id;

      const payment = await Payment.findOne({
        orderId: razorpayOrderId,
      });

      if (!payment) {
        return res.status(200).json(
          new ApiResponse(
            200,
            null,
            "Payment record not found, webhook acknowledged"
          )
        );
      }

      if (payment.paymentStatus === "completed") {
        return res.status(200).json(
          new ApiResponse(
            200,
            payment,
            "Payment already processed"
          )
        );
      }

      const session = await mongoose.startSession();

      try {
        session.startTransaction();

        payment.paymentStatus = "completed";
        payment.transactionId = razorpayPaymentId;

        await payment.save({ session });

        await Booking.findByIdAndUpdate(
          payment.booking,
          {
            paymentStatus: "completed",
            paymentId: payment._id,
          },
          {
            session,
          }
        );

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }

      break;
    }

    case "payment.failed": {
      const paymentEntity = event.payload.payment.entity;

      const payment = await Payment.findOne({
        orderId: paymentEntity.order_id,
      });

      if (payment && payment.paymentStatus !== "completed") {
        payment.paymentStatus = "failed";
        payment.failureReason =
          paymentEntity.error_description || "Payment failed";

        await payment.save();
      }

      break;
    }

    default:
      // Other Razorpay events are acknowledged
      break;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Webhook processed successfully"
    )
  );
});

export {
  createPayment,
  verifyPayment,
  markPaymentFailed,
  getMyPayments,
  getPaymentById,
  razorpayWebhook
};