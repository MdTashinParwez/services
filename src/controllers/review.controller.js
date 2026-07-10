import mongoose from "mongoose";
import { apiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Booking } from "../models/booking.model.js";
import asyncHandler from '../utils/asyncHandler.js';
import { Review } from "../models/review.model.js";

const createReview = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const {
    bookingId,
    rating,
    title,
    comment,
    ratingBreakdown,
  } = req.body;

  if (!bookingId || !rating || !title) {
    throw new apiError(
      400,
      "Booking id, rating and title are required"
    );
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
      "You are not allowed to review this booking"
    );
  }

  if (booking.status !== "completed") {
    throw new apiError(
      400,
      "Only completed bookings can be reviewed"
    );
  }

  if (booking.paymentStatus !== "completed") {
    throw new apiError(
      400,
      "Payment must be completed before reviewing"
    );
  }
  if (booking.isReviewed) {
    throw new apiError(
      400,
      "Review already submitted"
    );
  }

  if (rating < 1 || rating > 5) {
    throw new apiError(
      400,
      "Rating must be between 1 and 5"
    );
  }

  const review = await Review.create({
    booking: booking._id,
    customer: booking.customer,
    provider: booking.provider,
    service: booking.service,
    rating,
    title,
    comment,
    ratingBreakdown,
    isVerifiedBooking: true,
  });

  booking.isReviewed = true;
  booking.reviewId = review._id;

  await booking.save();

  const createdReview = await Review.findById(review._id)
    .populate("customer", "fullName profileImage")
    .populate("provider", "businessName")
    .populate("service", "title")
    .populate("booking");

  return res.status(201).json(
    new ApiResponse(
      201,
      createdReview,
      "Review submitted successfully"
    )
  );
});

const getMyReviews = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 20);
  const skip = (page - 1) * limit;

  const totalReviews = await Review.countDocuments({
    customer: req.user._id,
  });

  const reviews = await Review.find({
    customer: req.user._id,
  })
    .populate("booking")
    .populate("provider", "businessName isVerified")
    .populate("service", "title price")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
      },
      "Reviews fetched successfully"
    )
  );
});

const getReviewById = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid review id");
  }

  const review = await Review.findById(id)
    .populate("booking")
    .populate("customer", "fullName email profileImage")
    .populate("provider", "businessName isVerified")
    .populate("service", "title price");

  if (!review) {
    throw new apiError(404, "Review not found");
  }

  if (review.customer.toString() !== req.user._id.toString()) {
    throw new apiError(403, "Access denied");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      review,
      "Review fetched successfully"
    )
  );
});


const updateReview = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const { id } = req.params;
  const { rating, title, comment, ratingBreakdown } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid review id");
  }

  const review = await Review.findById(id);

  if (!review) {
    throw new apiError(404, "Review not found");
  }

  if (review.customer.toString() !== req.user._id.toString()) {
    throw new apiError(403, "Access denied");
  }

  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      throw new apiError(400, "Rating must be between 1 and 5");
    }
    review.rating = rating;
  }
  
  if (title !== undefined) {
    if (!title.trim()) {
        throw new apiError(400, "Title cannot be empty");
    }
    review.title = title.trim();
}

  if (comment !== undefined) {
    review.comment = comment;
  }

  if (ratingBreakdown !== undefined) {
    review.ratingBreakdown = ratingBreakdown;
  }

  review.isEdited = true;
  review.editedAt = new Date();

  await review.save();

  const updatedReview = await Review.findById(review._id)
    .populate("customer", "fullName profileImage")
    .populate("provider", "businessName")
    .populate("service", "title");

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedReview,
      "Review updated successfully"
    )
  );
});

const deleteReview = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid review id");
  }

  const review = await Review.findById(id);

  if (!review) {
    throw new apiError(404, "Review not found");
  }

  if (review.customer.toString() !== req.user._id.toString()) {
    throw new apiError(403, "Access denied");
  }

  await Booking.findByIdAndUpdate(review.booking, {
    isReviewed: false,
    reviewId: null,
  });

  await Review.findByIdAndDelete(review._id);

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Review deleted successfully"
    )
  );
});

export {
  createReview,
  getMyReviews,
  getReviewById,
  updateReview,
  deleteReview,
};