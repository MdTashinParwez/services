import { apiError } from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

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
    throw new apiError(400,"Booking faild");
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

