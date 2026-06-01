import mongoose ,{Schema} from 'mongoose';


const serviceSchema = new Schema(
  {
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a service title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    images: [
      {
        type: String, // Cloudinary URL
      },
    ],
    duration: {
      type: Number, // in minutes
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
      address: String,
      city: String,
      radius: Number, // service coverage radius in km
    },
    serviceType: {
      type: String,
      enum: ['online', 'onsite', 'hybrid'],
      default: 'onsite',
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    bookingCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [String],
    customFields: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Service = mongoose.model('Service', serviceSchema);
