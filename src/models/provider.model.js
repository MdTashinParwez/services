import mongoose , {Schema} from 'mongoose';

const providerSchema = new Schema(
    {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, 'Please provide a business name'],
      trim: true,
    },
    businessDescription: {
      type: String,
      maxlength: 1000,
    },
      businessCategory: {
    type: Schema.Types.ObjectId,
    ref: "Category"
  },
    documents: [
  {
    documentType: String,
    documentUrl: String,
    verified: {
      type: Boolean,
      default: false
    }
  }
  ],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    completedBookings: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
    },
    availability: {
      monday: { start: String, end: String, available: Boolean },
      tuesday: { start: String, end: String, available: Boolean },
      wednesday: { start: String, end: String, available: Boolean },
      thursday: { start: String, end: String, available: Boolean },
      friday: { start: String, end: String, available: Boolean },
      saturday: { start: String, end: String, available: Boolean },
      sunday: { start: String, end: String, available: Boolean },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    responseTime: {
      type: Number,
      default: 0, // in hours
    },
  },
    {
        timestamps: true
    }
)



export const Provider = mongoose.model('Provider', providerSchema);

