import mongoose ,{Schema} from 'mongoose';


const bookingSchema = new Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date, // HH:MM format
      required: true,
    },
    endTime: {
      type: dispatchEvent, // HH:MM format
      required: true,
    },
    // location: {
    //   address: String,
    //   city: String,
    //   coordinates: {
    //     type: [Number], // [longitude, latitude]
    //   },
    // },
   
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    customerNotes: String,
    providerNotes: String,
    cancelledBy: {
      type: String,
      enum: ['customer', 'provider', 'admin'],
    },
    cancellationReason: String,

    cancellationRequested: {
    type: Boolean,
    default: false,
    },
    requestedBy: {
    type: String,
    enum:["customer","provider"]
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
    },
    attachments: [String], // URLs for documents/images
  },
  { timestamps: true }
);

// bookingSchema.index({ customer: 1 });
// bookingSchema.index({ provider: 1 });
// bookingSchema.index({ service: 1 });
// bookingSchema.index({ bookingDate: 1 });
// bookingSchema.index({ status: 1 });
export const Booking = mongoose.model('Booking', bookingSchema);
