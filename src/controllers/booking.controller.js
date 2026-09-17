import { Booking } from "../models/booking.model.js";
import mongoose, { mongo } from "mongoose";
import { Provider } from "../models/provider.model.js";
import { User } from "../models/user.model.js";
import { Category } from "../models/category.model.js";
import { apiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Service } from "../models/service.model.js";
import notificationQueue from "../queues/notification.queue.js";
import { Notification } from "../models/notification.model.js";
import { BookingSlot } from "../models/BookingSlot.model.js";
import { generateBookingSlots, SLOT_INTERVAL } from "../utils/providerAvailabilty.utils.js";
import { ProviderAvailability } from "../models/ProviderAvailability.model.js";

const createBooking = asyncHandler(async (req, res) => {

  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const {
    serviceId,
    bookingDate,
    startTime,
    customerNotes,
  } = req.body;

  if (!serviceId || !bookingDate || !startTime ) {
    throw new apiError(
      400,
      "Service, booking date, and start time are required"
    );
  }

  // Validate inputs

  if (!mongoose.isValidObjectId(serviceId)) {
    throw new apiError(400, "Invalid service id");
  }

  const service = await Service.findById(serviceId);

  if (!service) {
    throw new apiError(404, "Service not found");
  }

  if (!service.isActive) {
    throw new apiError(400, "Service is not active");
  }

  const provider = await Provider.findById(service.provider);

  if (!provider) {
    throw new apiError(404, "provider is not exits");
  }

  // if (!provider.isActive) {
  //   throw new apiError(400, "Provider is not active");
  // }

  if (!provider.isApproved) {
    throw new apiError(403, "provider is not approved");
  }

  if (provider.user.toString() === req.user._id.toString()) {
    throw new apiError(403, "You can not book your own service");
  }

  // const bookingDay = new Date(bookingDate);

  // if (isNaN(bookingDay.getTime())) {
  //   throw new apiError(400, "Invalid booking date");
  // }

//   bookingDay.setHours(0, 0, 0, 0); // Set to start of the day

//   const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
//   if (!timeRegex.test(startTime)) {
//     throw new apiError(400, "Time must be in HH:MM format");
//   }

//   // const bookingStart = new Date(bookingDay);
//   // const bookingEnd = new Date(bookingDay);

//   const [startHour, startMinute] = startTime.split(":").map(Number);

//   if (startMinute % SLOT_INTERVAL !== 0) {
//   throw new apiError(
//     400,
//     `Start time must be in ${SLOT_INTERVAL}-minute intervals`
//   );
// }
  
//   if (!service.duration || service.duration <= 0) {
//   throw new apiError(400, "Service duration is invalid");
// }
//   if (bookingStart >= bookingEnd) {
//     throw new apiError(400, "End time must be after start time");
//   }

//   if (bookingStart < new Date()) {
//     throw new apiError(400, "Booking time cannot be in the past");
//   }

//   // check booking time is within provider availability
//   const dayOfWeek = bookingDay.getDay();
// const availability = await ProviderAvailability.find({
//   provider: provider._id,
//   dayOfWeek,
//   isAvailable: true,
// });

// const isWithinAvailability = availability.some((window) => {
//   const [startHour, startMinute] = window.startTime.split(":").map(Number);
//   const [endHour, endMinute] = window.endTime.split(":").map(Number);

//   const windowStart = new Date(bookingDay);
//   windowStart.setHours(startHour, startMinute, 0, 0);

//   const windowEnd = new Date(bookingDay);
//   windowEnd.setHours(endHour, endMinute, 0, 0);

//   return (
//     bookingStart >= windowStart &&
//     bookingEnd <= windowEnd
//   );
// });

// if (!isWithinAvailability) {
//   throw new apiError(
//     400,
//     "Selected time is outside provider availability"
//   );
// }

const bookingDay = new Date(bookingDate);

if (isNaN(bookingDay.getTime())) {
  throw new apiError(400, "Invalid booking date");
}

bookingDay.setHours(0, 0, 0, 0);

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

if (!timeRegex.test(startTime)) {
  throw new apiError(400, "Time must be in HH:MM format");
}

const [startHour, startMinute] = startTime.split(":").map(Number);

if (startMinute % SLOT_INTERVAL !== 0) {
  throw new apiError(
    400,
    `Start time must be in ${SLOT_INTERVAL}-minute intervals`
  );
}

if (!service.duration || service.duration <= 0) {
  throw new apiError(400, "Service duration is invalid");
}

const bookingStart = new Date(bookingDay);
const bookingEnd = new Date(bookingDay);

bookingStart.setHours(startHour, startMinute, 0, 0);

bookingEnd.setTime(
  bookingStart.getTime() + service.duration * 60 * 1000
);

if (bookingStart >= bookingEnd) {
  throw new apiError(400, "End time must be after start time");
}

if (bookingStart < new Date()) {
  throw new apiError(400, "Booking time cannot be in the past");
}

// Check booking time is within provider availability
const dayOfWeek = bookingDay.getDay();

const availability = await ProviderAvailability.find({
  provider: provider._id,
  dayOfWeek,
  isAvailable: true,
});

const isWithinAvailability = availability.some((window) => {
  const [windowStartHour, windowStartMinute] =
    window.startTime.split(":").map(Number);

  const [windowEndHour, windowEndMinute] =
    window.endTime.split(":").map(Number);

  const windowStart = new Date(bookingDay);
  windowStart.setHours(
    windowStartHour,
    windowStartMinute,
    0,
    0
  );

  const windowEnd = new Date(bookingDay);
  windowEnd.setHours(
    windowEndHour,
    windowEndMinute,
    0,
    0
  );

  return (
    bookingStart >= windowStart &&
    bookingEnd <= windowEnd
  );
});

if (!isWithinAvailability) {
  throw new apiError(
    400,
    "Selected time is outside provider availability"
  );
}


  const existingBooking = await Booking.findOne({
    // service: service._id,
    provider: provider._id,
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

  const session = await mongoose.startSession();

let booking;

try {
  await session.withTransaction(async () => {
    const createdBookings = await Booking.create(
      [
        {
          customer: req.user._id,
          service: service._id,
          provider: provider._id,
          bookingDate: bookingDay,
          servicePrice,
          totalAmount,
          startTime: bookingStart,
          endTime: bookingEnd,
          customerNotes,
        },
      ],
      { session }
    );

    booking = createdBookings[0];

    const bookingSlots = generateBookingSlots({
      startTime: bookingStart,
      duration: service.duration,
    }).map((slot) => ({
      provider: provider._id,
      booking: booking._id,
      slotStart: slot.slotStart,
      slotEnd: slot.slotEnd,
    }));

    await BookingSlot.insertMany(
      bookingSlots,
      { session }
    );
  });
  } catch (error) {
    if (error.code === 11000) {
      throw new apiError(
        409,
        "Selected time slot is no longer available"
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }


  const createdBooking = await Booking.findById(booking._id)
    .populate("service", "title price")
    .populate("provider", "businessName isVerified")
    .populate("customer", "username email");

  if (!createdBooking) {
    throw new apiError(400, "Booking failed");
  }


  // PERSISTENT NOTIFICATION
  await Notification.create({
    recipient: provider.user,
    sender: req.user._id,
    type: "booking_request",
    title: "New Booking Request",
    message: "You have received a new booking request",
    data: {
      bookingId: booking._id,
      serviceId: booking.service,
      providerId: booking.provider,
    },
    priority: "medium",
  });


  await notificationQueue.add("booking-created-email", {
    bookingId: createdBooking._id.toString(),
  });


  // REAL-TIME NOTIFICATION
  const io = req.app.get("io");

  io.to(`user:${provider.user}`).emit("booking-created", {
    bookingId: booking._id,
    message: "You have received a new booking",
  });


  await Service.findByIdAndUpdate(service._id, {
    $inc: {
      bookingCount: 1,
    },
  });

  await Provider.findByIdAndUpdate(provider._id, {
    $inc: {
      totalBookings: 1,
    },
  });


  return res.status(201).json(
    new ApiResponse(
      201,
      createdBooking,
      "Booking created successfully"
    )
  );
});


const getMyBookings = asyncHandler(async (req, res) => {

  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);

  const limit = Math.min(
    Math.max(parseInt(req.query.limit) || 10, 1),
    20
  );

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


  const userId = req.user._id.toString();

  const isCustomer =
    booking.customer._id.toString() === userId;

  let isProvider = false;

  if (req.user.role === "provider") {

    const provider = await Provider.findOne({
      user: req.user._id,
    });

    if (
      provider &&
      booking.provider._id.toString() === provider._id.toString()
    ) {
      isProvider = true;
    }
  }

  if (!isCustomer && !isProvider) {
    throw new apiError(403, "Access denied");
  }


  return res.status(200).json(
    new ApiResponse(
      200,
      {
        booking,
        isProvider,
        isCustomer,
      },
      "Booking fetched successfully"
    )
  );
});


const cancelBooking = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(400, "Unauthorized request");
  }

  const { cancellationReason } = req.body || {};
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid id");
  }

  // Booking business logic
  const booking = await Booking.findById(id);

  if (!booking) {
    throw new apiError(404, "Booking not found");
  }

  if (
    booking.customer.toString() !==
    req.user._id.toString()
  ) {
    throw new apiError(403, "Access Denied");
  }

  if (booking.status === "completed") {
    throw new apiError(
      400,
      "Completed booking cannot be cancelled"
    );
  }

  if (booking.status === "cancelled") {
    throw new apiError(
      400,
      "Booking is already cancelled"
    );
  }

  if (booking.status === "in-progress") {
    throw new apiError(
      400,
      "Booking is already in progress"
    );
  }

  if (
    cancellationReason &&
    cancellationReason.trim().length > 100
  ) {
    throw new apiError(
      400,
      "Cancellation reason is too long"
    );
  }

  // Transaction
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {

      booking.status = "cancelled";
      booking.cancelledBy = "customer";
      booking.cancellationReason = cancellationReason;

      await booking.save({ session });

      // Release reserved booking slots
      await BookingSlot.deleteMany(
        { booking: booking._id },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  const provider = await Provider.findById(booking.provider);

  if (!provider) {
    throw new apiError(404, "Provider not found");
  }

  // Persistent notification
  await Notification.create({
    recipient: provider.user,
    sender: req.user._id,
    type: "booking_cancelled",
    title: "Booking Cancelled",
    message: "A customer has cancelled a booking",
    data: {
      bookingId: booking._id,
      serviceId: booking.service,
      providerId: booking.provider,
    },
    priority: "medium",
  });

  await notificationQueue.add("booking-cancelled-email", {
    bookingId: booking._id.toString(),
  });

  // Real-time notification
  const io = req.app.get("io");

  io.to(`user:${provider.user}`).emit("booking-cancelled", {
    bookingId: booking._id,
    message: "A customer has cancelled a booking",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      booking,
      "Booking cancelled successfully"
    )
  );
});

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

  const limit = Math.min(
    Math.max(parseInt(req.query.limit) || 10, 1),
    20
  );

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
    .populate("customer", "username email avatar")
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

  if (
    booking.provider.toString() !==
    currentProvider._id.toString()
  ) {
    throw new apiError(
      403,
      "You are not allowed to accept this booking"
    );
  }

  if (booking.status === "accepted") {
    throw new apiError(400, "Booking is already accepted");
  }

  if (booking.status === "cancelled") {
    throw new apiError(
      400,
      "Cancelled booking cannot be accepted"
    );
  }

  if (booking.status === "completed") {
    throw new apiError(
      400,
      "Completed booking cannot be accepted"
    );
  }

  if (booking.status === "in-progress") {
    throw new apiError(
      400,
      "Booking is already in progress"
    );
  }

  booking.status = "accepted";

  await booking.save();



  // PERSISTENT NOTIFICATION

  await Notification.create({
    recipient: booking.customer,
    sender: req.user._id,
    type: "booking_accepted",
    title: "Booking Accepted",
    message: "Your booking has been accepted",
    data: {
      bookingId: booking._id,
      serviceId: booking.service,
      providerId: booking.provider,
    },
    priority: "medium",
  });


  await notificationQueue.add("booking-accepted-email", {
    bookingId: booking._id.toString(),
  });


  const io = req.app.get("io");
  io.to(`user:${booking.customer}`).emit("booking-accepted", {
    bookingId: booking._id,
    message: "Your booking has been accepted",
  });
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

  const { rejectionReason } = req.body || {};
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

  if (
    booking.provider.toString() !==
    currentProvider._id.toString()
  ) {
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
    throw new apiError(
      400,
      "Booking is already cancelled"
    );
  }

  if (booking.status === "completed") {
    throw new apiError(
      400,
      "Completed booking cannot be rejected"
    );
  }

  if (booking.status === "in-progress") {
    throw new apiError(
      400,
      "Booking is already in progress"
    );
  }

  if (
    rejectionReason &&
    rejectionReason.trim().length > 100
  ) {
    throw new apiError(
      400,
      "Cancellation reason is too long"
    );
  }

  // Transaction
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {

      booking.status = "cancelled";
      booking.cancelledBy = "provider";
      booking.cancellationReason = rejectionReason;

      await booking.save({ session });

      // Release reserved booking slots
      await BookingSlot.deleteMany(
        { booking: booking._id },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  // Notification
  await Notification.create({
    recipient: booking.customer,
    sender: req.user._id,
    type: "booking_rejected",
    title: "Booking Rejected",
    message: "Your booking has been rejected",
    data: {
      bookingId: booking._id,
      serviceId: booking.service,
      providerId: booking.provider,
    },
    priority: "medium",
  });

  await notificationQueue.add("booking-rejected-email", {
    bookingId: booking._id.toString(),
  });

  // Real-time notification
  const io = req.app.get("io");

  io.to(`user:${booking.customer}`).emit("booking-rejected", {
    bookingId: booking._id,
    message: "Your booking has been rejected",
  });

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

  if (
    booking.provider.toString() !==
    currentProvider._id.toString()
  ) {
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

  if (
    booking.provider.toString() !==
    currentProvider._id.toString()
  ) {
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

  // Transaction
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // 1. Complete booking
      booking.status = "completed";

      await booking.save({ session });

      // 2. Release reserved booking slots
      await BookingSlot.deleteMany(
        { booking: booking._id },
        { session }
      );

      // 3. Update provider stats
      currentProvider.completedBookings += 1;
      currentProvider.totalEarnings += booking.totalAmount;

      await currentProvider.save({ session });
    });
  } finally {
    await session.endSession();
  }

  // Persistent notification
  await Notification.create({
    recipient: booking.customer,
    sender: req.user._id,
    type: "service_completed",
    title: "Booking Completed",
    message: "Your booking has been completed",
    data: {
      bookingId: booking._id,
      serviceId: booking.service,
      providerId: booking.provider,
    },
    priority: "medium",
  });

  // Email notification
  await notificationQueue.add("booking-completed-email", {
    bookingId: booking._id.toString(),
  });

  // Real-time notification
  const io = req.app.get("io");

  io.to(`user:${booking.customer}`).emit("booking-completed", {
    bookingId: booking._id,
    message: "Your booking has been completed",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      booking,
      "Booking completed successfully"
    )
  );
});



export {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getProviderBookings,
  acceptBooking,
  rejectBooking,
  startBooking,
  completeBooking,
};