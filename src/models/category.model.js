import mongoose ,{Schema} from 'mongoose';

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a category name'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: String,
    icon: String, // URL or icon name
    image: String, // Cloudinary URL
    subcategories: [String],
    serviceCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
  },
  { timestamps: true }
);



export const Category = mongoose.model('Category', categorySchema);