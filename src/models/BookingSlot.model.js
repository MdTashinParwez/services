import mongoose, { Schema } from "mongoose";

const bookingSlotSchema = new Schema(
  {
    provider: {
      type: Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
      index: true,
    },

    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    slotStart: {
      type: Date,
      required: true,
    },

    slotEnd: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

bookingSlotSchema.index(
  {
    provider: 1,
    slotStart: 1,
  },
  {
    unique: true,
  }
);

export const BookingSlot = mongoose.model(
  "BookingSlot",
  bookingSlotSchema
);