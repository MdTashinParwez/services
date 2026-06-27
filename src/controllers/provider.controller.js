import mongoose from "mongoose";
import { Provider } from "../models/provider.model.js";
import { User } from "../models/user.model.js";
import { Category } from "../models/category.model.js";
import { apiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const providerUser = asyncHandler(async(req,res) =>{

    const {businessName,businessDescription,
    businessCategory} = req.body;

    if(!req.user?._id){
        throw new apiError(401, "Unauthorized request")
    }

    if( [businessName,businessDescription,
    businessCategory].some((field) => !field?.trim())){
        throw new apiError(400, "All fields are required") 
    }

    if(!mongoose.isValidObjectId(businessCategory)){
        throw new apiError(400, "Invalid business category")
    }

    const category = await Category.findById(businessCategory)


    if(!category){
        throw new apiError(404, "Business category not found")
    }

    const alreadyProvider = await Provider.findOne({ user: req.user._id })

    if(alreadyProvider){
        throw new apiError(409, "User is already a provider")
    }

    const existingProvider = await Provider.findOne({
        $or:[
            {businessName: businessName.toLowerCase()},
        ]
    }) 

    if(existingProvider){
        throw new apiError(409,"Provider with this name is already exists")
    }

   const documentPath  =
    req.file?.path ||
    req.files?.document?.[0]?.path ||
    req.files?.documents?.[0]?.path ||
    req.files?.avatar?.[0]?.path;

    if(!documentPath){
        throw new apiError(400, "document {Aadher card } is required")
    }

   const documents  = await uploadOnCloudinary(documentPath)

   if(!documents?.url){
    throw new apiError(500, "documents upload failed")
   }

   const provider = await Provider.create({
      user: req.user._id,
    businessName : businessName.toLowerCase(),
    businessDescription,
    documents: [
      {
        documentType: "identity",
        documentUrl: documents.url,
      }
    ],
    businessCategory,
    isVerified: false,
    isApproved: false
   }) 
  const updatedUser =  await User.findByIdAndUpdate(
   req.user._id,
   {
      $set: {
         role: "provider"
      }
   },
   { new: true }
   ).select("-password -refreshToken")
   const createProvider = await Provider.findById(provider._id).populate("businessCategory")

   if(!createProvider){
       throw new apiError(500, "Failed to create Provider")
      }
      return res.status(201).json(new ApiResponse(201,{provider: createProvider, user: updatedUser}, "Provider created  successfully"))
})

const updateProviderDetail = asyncHandler(async (req,res) => {
    const {businessName,businessDescription,
    businessCategory} = req.body 

    const existingProvider = await provider.findOne({
        id: {$ne: req.user?._id},
        $or:[{businessName}]
    })
    if(existingProvider){
        throw new apiError(409,"Provider with this name is already exist")
    }
})

export { providerUser }
