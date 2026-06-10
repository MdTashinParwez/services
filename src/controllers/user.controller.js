import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import User from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/apiResponse.js';
const registerUser = asyncHandler(async (req,res)=>{
 
    // save user to database
    // return success response
   
  const {username,email,password} = req.body;
    
    // input validation
    if( [username,email,password].some((field) => field?.trim() === "")){
        throw new apiError(400, "All fields are required")
    }
    if(password.length < 6){
        throw new apiError(400, "Password must be at least 6 characters long")
    }
    if(!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]$/.test(email)){
        throw new apiError(400, "Invalid email format")
    }

     // check if user already exists
 const existingUser = await User.findOne({email});
        if(existingUser){
            throw new apiError(409, "User with this email already exists")
        }

    // avatar handling
    
   const avatarPath = req.files?.avatar?.[0]?.path || null;

   const avatar = await uploadOnCloudinary(avatarPath)
    if(!avatarPath){
        throw new apiError(400, "Avatar is required")
    }

    // create user
  const user =  await User.create({
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar?.url || null,
        phone,
        isVerified: false,
        // role will be assigned based on registration endpoint (e.g., /register/provider for providers)
    })
   const createdUser = await User.findById(user._id).select("-password -refreshToken")
   
   if(!createdUser){
    throw new apiError(500, "Failed to create user")
   }
   return res.status(201).json(new ApiResponse(200,createdUser, "User registered successfully"))

})

export {
    registerUser,
}

