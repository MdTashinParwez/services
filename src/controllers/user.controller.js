import asyncHandler from '../utils/asyncHandler.js';
import {apiError} from '../utils/apiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/apiResponse.js';
import jwt from "jsonwebtoken"



const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)

            if (!user) {
        throw new apiError(404, "User not found while generating tokens");
}
        const accessToken = user.generateAccessToken() 
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
    //     console.log("TOKEN ERROR:", error);
    // throw new apiError(500, error.message);

        throw new apiError(
            500,
            "Something went wrong while generating tokens"
        )
    }
}
  
const registerUser = asyncHandler(async (req,res)=>{
 
  const {username,email,password,phone} = req.body;
    
    // input validation
    if( [username,email,password,phone].some((field) => !field?.trim())){
        throw new apiError(400, "All fields are required")
    }
    if(password.length < 6){
        throw new apiError(400, "Password must be at least 6 characters long")
    }
    if(!/\S+@\S+\.\S+/.test(email)){
        throw new apiError(400, "Invalid email format")
    }

     // check if user already exists
        const existingUser = await User.findOne({
    $or: [
        { email },
        { username: username.toLowerCase() }
            ]
        })    
            if(existingUser){
            throw new apiError(409, "User with this email already exists")
        }

    // avatar handling
    
   const avatarPath = req.files?.avatar?.[0]?.path;

    if(!avatarPath){
        throw new apiError(400, "Avatar is required")
    }

   const avatar = await uploadOnCloudinary(avatarPath)

   if(!avatar?.url){
    throw new apiError(500, "Avatar upload failed")
   }

    // create user
  const user =  await User.create({
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar?.url || null,
        phone,
        isVerified: false,
        // role will be assigned based user choice , all are default user 
    })
   const createdUser = await User.findById(user._id).select("-password -refreshToken")
   
   if(!createdUser){
    throw new apiError(500, "Failed to create user")
   }
   return res.status(201).json(new ApiResponse(201,createdUser, "User registered successfully"))

})

const loginUser = asyncHandler(async (req, res)=>{

   const {email,password,phone} = req.body

   if((!email && !phone) || !password){
      throw new apiError(400, "Email/Phone and password are required")
   }

    const user = await  User.findOne({
    $or: [{email},{phone}]
   }).select("+password");

   if(!user){
    throw new apiError(404, "User does not exist ")
   }

   const isPasswordValid  = await user.isPasswordCorrect(password)
   if(!isPasswordValid){
    throw new apiError(401, "Invalid user credintial")
   }

   //token generate
   const {accessToken,refreshToken} = await 
   generateAccessAndRefreshTokens(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   const options = {
    httpOnly: true,
    secure: true,
   }

   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
    new ApiResponse(
        200,
        {
            user: loggedInUser, 
        },
        "user logged In Successfully"
    )
   )



    


})

const logoutUser = asyncHandler(async(req,res) =>{
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
    httpOnly: true,
    secure: true,
   }

   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200,{},"User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new apiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken.id).select("+refreshToken");

    if (!user) {
      throw new apiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new apiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );

  } catch (error) {
    throw new apiError(
      401,
      error?.message || "Invalid refresh token"
    );
  }
});

const changeCurrentPassword = asyncHandler(async(req,res) =>{
  const {oldPassword, newPassword} = req.body

  if(!oldPassword || !newPassword){
    throw new apiError(400,"Old password and new password are required")
  }

  if(oldPassword === newPassword){
    throw new apiError(400,"New password cannot be same as old password")
  }

  if(newPassword.length < 6){
    throw new apiError(400,"Password must be at least 6 characters long")
  }

  const user = await User.findById(req.user?._id).select("+password")
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect){
    throw new apiError(400,"Invalid old Password ")
  }
  user.password = newPassword
  await user.save()

  return res.status(200).json(new ApiResponse(200,{},"Password is updated"))


})

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(new ApiResponse(200, req.user, "current user fetched successfully"))

})

const updateProfileDetails = asyncHandler(async(req,res) =>{
  const {username, email, phone} = req.body 

  if([username, email, phone].some((field) => !field?.trim())){
    throw new apiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({
      _id: { $ne: req.user?._id },
      $or: [{ email }, { username: username.toLowerCase() }]
    })

    if(existingUser){
      throw new apiError(409, "User with this email or username already exists")
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set:{
          username: username.toLowerCase(),
          email: email,
          phone: phone
        }
      },
      {new:true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200, user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
   const avatarLocalPath = req.file?.path

   if(!avatarLocalPath){
    throw new apiError(400, "Avatar file is missing")
   }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar?.url){
      throw new apiError(400,"Error while uploading on avatar ")
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set:{
          avatar: avatar.url
        }
      },
      {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))
})

//this logic is used in future to manage the user an provdier
// const getUserdetails = asyncHandler(async(req,res)=>{
//  const {username} = req.params
//  if(!username) = req.params
  
//  if(!username?.trim()){
//   throw new apiError(400,"No user found")
//  }

// const channel =  User.aggregate([
//     { $match: {
//         username : username?.toLowerCase(),
//       }
//     },
//     {
//       $lookup:{
//         from: "subcription",
//         localField: "_id",
//         foreignField: "channel",
//         as: "subscribers"
//       }
//     },
//     {$addFields: {
//       subscribersCount:{
//         $size: "$subscribers"
//       },
//       channelSubscribedToCount: {
//         $size: "$subscribedTo"
//       },
      
//     }

//     }

// ])
// })

export {
    registerUser,
    loginUser, 
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateProfileDetails,
    updateUserAvatar
}
