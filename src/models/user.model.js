import mongoose ,{Schema} from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      trim: true,
      maxlength: 8,
      lowercase: true,
      index: true,
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    phone: {
      type: String,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['customer', 'provider', 'admin'],
      default: 'customer',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false, // Don't return refresh token by default
    },
   
    // resetPasswordToken: String,
    // resetPasswordExpire: Date,
    // lastLogin: Date,
  },
  { timestamps: true }
);



// Hashing password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return ;
    // next();
  }

 
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    // next();
  // } catch (error)
  //  {
  //   // next(error);
  // }
  });

// method 
userSchema.methods.isPasswordCorrect = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
   return jwt.sign(
    {
      id: this._id,
      email: this.email,
      username: this.username,
      role: this.role,
      
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
    {
      id: this._id,
      
      
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    }
  );
}

export const User = mongoose.model('User', userSchema);