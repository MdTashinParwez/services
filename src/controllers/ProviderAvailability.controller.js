import mongoose from "mongoose";
import { ProviderAvailability } from "../models/ProviderAvailability.model.js";
import { Provider } from "../models/provider.model.js";
import { apiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const createProviderAvailability = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const {
    dayOfWeek,
    startTime,
    endTime,
    isAvailable = true,
  } = req.body;

  // Basic validation
  if (dayOfWeek === undefined || !startTime || !endTime) {
    throw new apiError(
      400,
      "Day, start time and end time are required"
    );
  }

  if (
    !Number.isInteger(dayOfWeek) ||
    dayOfWeek < 0 ||
    dayOfWeek > 6
  ) {
    throw new apiError(400, "Invalid day of week");
  }

  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    throw new apiError(400, "Time must be in HH:MM format");
  }

  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);

  if (newStart >= newEnd) {
    throw new apiError(
      400,
      "End time must be after start time"
    );
  }

  // Find provider profile of logged-in user
  const provider = await Provider.findOne({
    user: req.user._id,
  });

  if (!provider) {
    throw new apiError(
      404,
      "Provider profile not found"
    );
  }

  // Check overlapping active availability windows
  const existingAvailabilities =
    await ProviderAvailability.find({
      provider: provider._id,
      dayOfWeek,
      isAvailable: true,
    });

  const hasOverlap = existingAvailabilities.some(
    (availability) => {
      const existingStart = timeToMinutes(
        availability.startTime
      );

      const existingEnd = timeToMinutes(
        availability.endTime
      );

      return (
        newStart < existingEnd &&
        newEnd > existingStart
      );
    }
  );

  if (hasOverlap) {
    throw new apiError(
      409,
      "Availability window overlaps with an existing window"
    );
  }

  const availability = await ProviderAvailability.create({
    provider: provider._id,
    dayOfWeek,
    startTime,
    endTime,
    isAvailable,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      availability,
      "Provider availability created successfully"
    )
  );
});

const getProviderAvailability = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const provider = await Provider.findOne({
    user: req.user._id,
  });

  if (!provider) {
    throw new apiError(
      404,
      "Provider profile not found"
    );
  }

  const availability = await ProviderAvailability.find({
    provider: provider._id,
  }).sort({
    dayOfWeek: 1,
    startTime: 1,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      availability,
      "Provider availability fetched successfully"
    )
  );
});

const updateProviderAvailability = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const { availabilityId } = req.params;
  const {
    dayOfWeek,
    startTime,
    endTime,
    isAvailable,
  } = req.body;

  if (!mongoose.isValidObjectId(availabilityId)) {
    throw new apiError(400, "Invalid availability id");
  }

  const provider = await Provider.findOne({
    user: req.user._id,
  });

  if (!provider) {
    throw new apiError(
      404,
      "Provider profile not found"
    );
  }

  const availability =
    await ProviderAvailability.findOne({
      _id: availabilityId,
      provider: provider._id,
    });

  if (!availability) {
    throw new apiError(
      404,
      "Availability not found"
    );
  }

  // Use existing values when a field is not provided
  const updatedDay =
    dayOfWeek !== undefined
      ? dayOfWeek
      : availability.dayOfWeek;

  const updatedStart =
    startTime !== undefined
      ? startTime
      : availability.startTime;

  const updatedEnd =
    endTime !== undefined
      ? endTime
      : availability.endTime;

  const updatedIsAvailable =
    isAvailable !== undefined
      ? isAvailable
      : availability.isAvailable;

  // Validate day
  if (
    !Number.isInteger(updatedDay) ||
    updatedDay < 0 ||
    updatedDay > 6
  ) {
    throw new apiError(
      400,
      "Invalid day of week"
    );
  }

  // Validate time format
  if (
    !timeRegex.test(updatedStart) ||
    !timeRegex.test(updatedEnd)
  ) {
    throw new apiError(
      400,
      "Time must be in HH:MM format"
    );
  }

  const newStart = timeToMinutes(updatedStart);
  const newEnd = timeToMinutes(updatedEnd);

  if (newStart >= newEnd) {
    throw new apiError(
      400,
      "End time must be after start time"
    );
  }

  // Check overlap with other availability windows
  const existingAvailabilities =
    await ProviderAvailability.find({
      provider: provider._id,
      dayOfWeek: updatedDay,
      isAvailable: true,
      _id: { $ne: availability._id },
    });

  const hasOverlap = existingAvailabilities.some(
    (existing) => {
      const existingStart = timeToMinutes(
        existing.startTime
      );

      const existingEnd = timeToMinutes(
        existing.endTime
      );

      return (
        newStart < existingEnd &&
        newEnd > existingStart
      );
    }
  );

  if (updatedIsAvailable && hasOverlap) {
    throw new apiError(
      409,
      "Availability window overlaps with an existing window"
    );
  }

  availability.dayOfWeek = updatedDay;
  availability.startTime = updatedStart;
  availability.endTime = updatedEnd;
  availability.isAvailable = updatedIsAvailable;

  await availability.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      availability,
      "Provider availability updated successfully"
    )
  );
});
const deleteProviderAvailability = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const { availabilityId } = req.params;

  if (!mongoose.isValidObjectId(availabilityId)) {
    throw new apiError(400, "Invalid availability id");
  }

  const provider = await Provider.findOne({
    user: req.user._id,
  });

  if (!provider) {
    throw new apiError(
      404,
      "Provider profile not found"
    );
  }

  const availability =
    await ProviderAvailability.findOneAndDelete({
      _id: availabilityId,
      provider: provider._id,
    });

  if (!availability) {
    throw new apiError(
      404,
      "Availability not found"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Provider availability deleted successfully"
    )
  );
});

export { createProviderAvailability, getProviderAvailability, updateProviderAvailability, deleteProviderAvailability };