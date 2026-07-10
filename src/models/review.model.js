import mongoose ,{Schema} from 'mongoose';

const reviewSchema = new Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      maxlength: 1000,
    },
    ratingBreakdown: {
      cleanliness: Number,
      professionalism: Number,
      communication: Number,
      punctuality: Number,
    },
    isEdited: {
    type: Boolean,
    default: false,
    },
    editedAt: Date,
    
    isHelpful: {
      type: Number,
      default: 0,
    },
    isVerifiedBooking: {
      type: Boolean,
      default: true,
    },
    flaggedAsInappropriate: {
      type: Boolean,
      default: false,
    },
    flagReason: String,
  },
  { timestamps: true }
);

export const Review = mongoose.model('Review', reviewSchema);
