import {Booking} from "../models/booking.model.js"
import mongoose, { mongo } from 'mongoose';
import { Provider } from '../models/provider.model.js';
import { User } from '../models/user.model.js';
import { Category } from '../models/category.model.js';
import { apiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const createBooking = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const {
    serviceId,
    bookingDate,
    startTime,
    endTime,
    customerNotes,
  } = req.body;

  if (!serviceId || !bookingDate || !startTime || !endTime) {
    throw new apiError(
      400,
      "Service, booking date, start time and end time are required"
    );
  }

  if (!mongoose.isValidObjectId(serviceId)) {
    throw new apiError(400, "Invalid service id");
  }

  const service = await Service.findById(serviceId);

  if (!service) {
    throw new apiError(404, "Service not found");
  }

  if(!service.isActive){
    throw new apiError(400, "Service is not active");
  }

  const provider =  await Provider.findById(service.provider) 

  if(!provider){
     throw new apiError(404, "provider is not exits");
  }
  if (!provider.isActive) {
  throw new apiError(400, "Provider is not active");
}
  if(!provider.isApproved){
     throw new apiError(403, "provider is not approved");
  }

  if(provider.user.toString() === req.user._id.toString()){
    throw new apiError(403, "You can not book your own service");
  }
  
  //  booking option
  const bookingStart = new Date(startTime);
  const bookingEnd = new Date(endTime);
  const bookingDay = new Date(bookingDate);

    if (isNaN(bookingDay.getTime())) {
        throw new apiError(400, "Invalid booking date");
    }

    if (bookingStart >= bookingEnd) {
    throw new apiError(400, "End time must be after start time");
    }
    if (bookingStart < new Date()) {
    throw new apiError(400, "Booking time cannot be in the past");
    }

    const existingBooking = await Booking.findOne({
    service: service._id,
    status: {
        $in: ["pending", "accepted", "in-progress"],
    },
    startTime: {
        $lt: bookingEnd,
    },
    endTime: {
        $gt: bookingStart,
    },
    });
    if (existingBooking) {
    throw new apiError(400, "Selected time slot is already booked");
    }


    const servicePrice = service.price;
    const totalAmount = service.price;


    const booking = await Booking.create({
        customer: req.user._id,
        service: service._id,
        provider:provider._id,
        bookingDate,
        startTime,
        endTime,
        servicePrice,
        totalAmount,
        customerNotes
    })
  const createdBooking = await Booking.findById(booking._id).populate("service", "title price")
  .populate("provider", "businessName isVerified")
  .populate("customer", "fullName email");

  if(!createdBooking){
    throw new apiError(400,"Booking failed");
  }
    await Service.findByIdAndUpdate(service._id, {
  $inc: {
    bookingCount: 1,
  },
  });

 return res.status(201).json(
    new ApiResponse(
        201,
        createdBooking,
        "Booking created successfully"
    )
);




});  //future: tranction 

const getMyBookings = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 20);
  const skip = (page - 1) * limit;

  const totalBookings = await Booking.countDocuments({
    customer: req.user._id,
  });

  const bookings = await Booking.find({
    customer: req.user._id,
  })
    .populate("service", "title price")
    .populate("provider", "businessName isVerified")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bookings,
        currentPage: page,
        totalPages: Math.ceil(totalBookings / limit),
        totalBookings,
      },
      "Bookings fetched successfully"
    )
  );
});

const getBookingById = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid booking id");
  }

  const booking = await Booking.findById(id)
    .populate("service", "title description price")
    .populate("provider", "businessName isVerified")
    .populate("customer", "fullName email");

  if (!booking) {
    throw new apiError(404, "Booking not found");
  }

  // Customer can only access their own booking
  if (booking.customer.toString() !== req.user._id.toString()) {
    throw new apiError(403, "Access denied");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      booking,
      "Booking fetched successfully"
    )
  );
});

const cancelBooking = asyncHandler(async (req,res) => {
  if(!req.user._id){
    throw new apiError(400,"unauthorize reqest")
  }
  const { cancellationReason } = req.body;

  const {id} = req.params

  if(!mongoose.isValidObjectId(id)){
        throw new apiError(400,"Invalid id")

  }

  // booking bussiness logic
  const booking = await Booking.findById(id)

  if(!booking){
        throw new apiError(404, "Booking not found");

  }
  if(booking.customer.toString() !== req.user._id.toString()){
    throw new apiError(403, "Access Denied");
  }
 if (booking.status === "completed") {
    throw new apiError(400, "Completed booking cannot be cancelled");
  }
  if (booking.status === "cancelled") {
    throw new apiError(400, "Booking is already cancelled");
  }
  if (booking.status === "in-progress") {
    throw new apiError(400, "Booking is already in progress");
  }

  booking.status = "cancelled";
  booking.cancelledBy  = "customer";
   if (cancellationReason && cancellationReason.trim().length > 100){
    throw new apiError(400,"Cancellation reason is too long");
  }
  booking.cancellationReason = cancellationReason;
 
  if (cancellationReason && cancellationReason.trim().length > 100){
    throw new apiError(400,"Cancellation reason is too long");
  }

   await booking.save();

  return res.status(200).json(
    new ApiResponse(
        200,
        booking,
        "Booking cancelled successfully"
    )
);

})

const getProviderBookings = asyncHandler(async (req, res) => {

  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }
  const currentProvider = await Provider.findOne({
    user: req.user._id,
  });

  if (!currentProvider) {
    throw new apiError(404, "Provider not found");
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 20);
  const skip = (page - 1) * limit;

  const { status } = req.query;

  const query = {
    provider: currentProvider._id,
  };

  if (status) {
    const allowedStatus = [
      "pending",
      "accepted",
      "in-progress",
      "completed",
      "cancelled",
    ];

    if (!allowedStatus.includes(status)) {
      throw new apiError(400, "Invalid booking status");
    }

    query.status = status;
  }

  const totalBookings = await Booking.countDocuments(query);

  const bookings = await Booking.find(query)
    .populate("customer", "fullName email profileImage")
    .populate("service", "title price images")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(totalBookings / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bookings,
        currentPage: page,
        totalPages,
        totalBookings,
      },
      "Bookings fetched successfully"
    )
  );
});


const acceptBooking = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid booking id");
  }

  const booking = await Booking.findById(id);

  if (!booking) {
    throw new apiError(404, "Booking not found");
  }

  const currentProvider = await Provider.findOne({
    user: req.user._id,
  });

  if (!currentProvider) {
    throw new apiError(404, "Provider not found");
  }

  if (booking.provider.toString() !== currentProvider._id.toString()) {
    throw new apiError(
      403,
      "You are not allowed to accept this booking"
    );
  }

  if (booking.status === "accepted") {
    throw new apiError(400, "Booking is already accepted");
  }

  if (booking.status === "cancelled") {
    throw new apiError(400, "Cancelled booking cannot be accepted");
  }

  if (booking.status === "completed") {
    throw new apiError(400, "Completed booking cannot be accepted");
  }

  if (booking.status === "in-progress") {
    throw new apiError(400, "Booking is already in progress");
  }

  booking.status = "accepted";

  await booking.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      booking,
      "Booking accepted successfully"
    )
  );
});

const rejectBooking = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const { rejectionReason } = req.body;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid booking id");
  }

  const booking = await Booking.findById(id);

  if (!booking) {
    throw new apiError(404, "Booking not found");
  }

  const currentProvider = await Provider.findOne({
    user: req.user._id,
  });

  if (!currentProvider) {
    throw new apiError(404, "Provider not found");
  }

  if (booking.provider.toString() !== currentProvider._id.toString()) {
    throw new apiError(
      403,
      "You are not allowed to reject this booking"
    );
  }

  if (booking.status === "accepted") {
    throw new apiError(
      400,
      "Accepted booking cannot be rejected. Please cancel it instead."
    );
  }

  if (booking.status === "cancelled") {
    throw new apiError(400, "Booking is already cancelled");
  }

  if (booking.status === "completed") {
    throw new apiError(400, "Completed booking cannot be rejected");
  }

  if (booking.status === "in-progress") {
    throw new apiError(400, "Booking is already in progress");
  }

  booking.status = "cancelled";
  booking.cancelledBy = "provider";
   if (rejectionReason && rejectionReason.trim().length > 100){
    throw new apiError(400,"Cancellation reason is too long");
  }
  booking.cancellationReason = rejectionReason;

  await booking.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      booking,
      "Booking rejected successfully"
    )
  );
});

const startBooking = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid booking id");
  }

  const booking = await Booking.findById(id);

  if (!booking) {
    throw new apiError(404, "Booking not found");
  }

  const currentProvider = await Provider.findOne({
    user: req.user._id,
  });

  if (!currentProvider) {
    throw new apiError(404, "Provider not found");
  }

  if (booking.provider.toString() !== currentProvider._id.toString()) {
    throw new apiError(
      403,
      "You are not allowed to start this booking"
    );
  }

  if (booking.status !== "accepted") {
    throw new apiError(
      400,
      "Only accepted bookings can be started"
    );
  }

  booking.status = "in-progress";

  await booking.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      booking,
      "Booking started successfully"
    )
  );
});

const completeBooking = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid booking id");
  }

  const booking = await Booking.findById(id);

  if (!booking) {
    throw new apiError(404, "Booking not found");
  }

  const currentProvider = await Provider.findOne({
    user: req.user._id,
  });

  if (!currentProvider) {
    throw new apiError(404, "Provider not found");
  }

  if (booking.provider.toString() !== currentProvider._id.toString()) {
    throw new apiError(
      403,
      "You are not allowed to complete this booking"
    );
  }

  if (booking.status !== "in-progress") {
    throw new apiError(
      400,
      "Only in-progress bookings can be completed"
    );
  }

  booking.status = "completed";

  await booking.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      booking,
      "Booking completed successfully"
    )
  );
});

export{
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getProviderBookings,
  acceptBooking,
  rejectBooking,
  startBooking,
  completeBooking,
}