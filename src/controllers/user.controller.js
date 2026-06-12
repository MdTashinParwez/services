import asyncHandler from '../utils/asyncHandler.js';
import {apiError} from '../utils/apiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/apiResponse.js';

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating tokens"
        )
    }
}
  
const registerUser = asyncHandler(async (req,res)=>{
 
  const {username,email,password,phone} = req.body;
    
    // input validation
    if( [username,email,password,phone].some((field) => field?.trim() === "")){
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
        { username }
            ]
        })    
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
        // role will be assigned based user choice , all are default user 
    })
   const createdUser = await User.findById(user._id).select("-password -refreshToken")
   
   if(!createdUser){
    throw new apiError(500, "Failed to create user")
   }
   return res.status(200).json(new ApiResponse(200,createdUser, "User registered successfully"))

})

const loginUser = asyncHandler(async (req, res)=>{

   const {email,password,phone} = req.body

   if(!email && !phone){
      throw new ApiError(400, "Email or phone is required")
   }

    const user = await  User.findOne({
    $or: [{email},{phone}]
   })

   if(!user){
    throw new ApiError(404, "User does not exist ")
   }

   const isPasswordValid  = await user.isPasswordCorrect(password)
   if(!isPasswordValid){
    throw new ApiError(401, "Invalid user credintial")
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
            user: loggedInUser, accessToken,
            refreshToken
        },
        "user logged In Successfully"
    )
   )



    


})

const logouotUser = asyncHandler(async(req,res) =>{
    
})

export {
    registerUser,
    loginUser,
    logouotUser
}

