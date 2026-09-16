import mongoose, { Schema } from "mongoose";

const providerAvailabilitySchema = new Schema(
  {
    provider: {
      type: Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
      index: true,
    },

    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Multiple windows per day allowed.
providerAvailabilitySchema.index({
  provider: 1,
  dayOfWeek: 1,
});

export const ProviderAvailability = mongoose.model(
  "ProviderAvailability",
  providerAvailabilitySchema
);