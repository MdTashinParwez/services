import mongoose, { mongo } from 'mongoose';
import { Provider } from '../models/provider.model.js';
import { User } from '../models/user.model.js';
import { Category } from '../models/category.model.js';
import { apiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const providerUser = asyncHandler(async (req, res) => {
  const { businessName, businessDescription, businessCategory } = req.body;

  if (!req.user?._id) {
    throw new apiError(401, 'Unauthorized request');
  }
  if (!businessName?.trim() || !businessDescription?.trim() || !businessCategory) {
    throw new apiError(400, 'All fields are required');
  }

  if (!mongoose.isValidObjectId(businessCategory)) {
    throw new apiError(400, 'Invalid business category');
  }

  const category = await Category.findById(businessCategory);

  if (!category) {
    throw new apiError(404, 'Business category not found');
  }

  const alreadyProvider = await Provider.findOne({ user: req.user._id });

  if (alreadyProvider) {
    throw new apiError(409, 'User is already a provider');
  }

  const existingProviderName = await Provider.findOne({
    businessName: businessName.toLowerCase(),
  });

  if (existingProviderName) {
    throw new apiError(409, 'Provider with this name is already exists');
  }
   // todo what if provider fail and 
  const documentPath = req.files?.documents?.[0]?.path;
  if (!documentPath) {
    throw new apiError(400, 'document {Aadher card } is required');
  }

  const documents = await uploadOnCloudinary(documentPath);

  if (!documents?.url) {
    throw new apiError(500, 'documents upload failed');
  }

  const session = await mongoose.startSession();
  let provider;
  let updatedUser;
  try {
    session.startTransaction();
    [provider] = await Provider.create(
      [
        {
          user: req.user._id,
          businessName: businessName.toLowerCase(),
          businessDescription,
          documents: [
            {
              documentType: 'identity',
              documentUrl: documents.url,
            },
          ],

          businessCategory,
          isVerified: false,
          isApproved: false,
        },
      ],
      { session }
    );

    updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          role: 'provider',
        },
      },
      { new: true, session }
    ).select('-password -refreshToken');
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();

    throw error;
  } finally {
    session.endSession();
  }

  const populatedProvider = await Provider.findById(provider._id).populate('businessCategory');
  if (!populatedProvider) {
    throw new apiError(500, 'Failed to fetch created provider');
  }
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { provider: populatedProvider, user: updatedUser },
        'Provider created  successfully'
      )
    );
});

const updateProviderDetail = asyncHandler(async (req,res) => {

  const { businessName, businessDescription, businessCategory } = req.body; 

  if (
  !businessName?.trim() ||
  !businessDescription?.trim() ||
  !businessCategory) {throw new apiError(400, 'All fields are required');}

  // check category & businessName 
  if (!mongoose.isValidObjectId(businessCategory)) {
  throw new apiError(400, 'Invalid business category');}

  const category = await Category.findById(businessCategory);
  if (!category) {
  throw new apiError(404, 'Business category not found');}


  const currentProvider = await Provider.findOne({
    user:req.user._id 
  });  
  if(!currentProvider){
   throw new apiError(404,"Provider not found")
  }
  const existingProviderName = await Provider.findOne({
     _id:{ $ne:currentProvider._id}, //p1
     businessName: businessName.toLowerCase()
  }) 
  if(existingProviderName){
    throw new apiError(409,"Provider with Bussiness Name already exists");
  }

  // update after validation 
  const provider = await Provider.findByIdAndUpdate(currentProvider._id,
    {
      $set: {
        businessName : businessName.toLowerCase(),
        businessDescription: businessDescription,
        businessCategory: businessCategory
      }
    },
    {new: true}
  )
  return res
  .status(200)
  .json (new ApiResponse(200, provider,"Provider Detail updated "))

  
});
 
const updateProviderDocument = asyncHandler(async (req,res) => {
  const currentProvider = await Provider.findOne({
    user:req.user._id 
  })
  if(!currentProvider){
   throw new apiError(404,"Provider not found" )
}
  
  const documentLocalPath = req.file?.path  

  if(!documentLocalPath){
        throw new apiError(400, "Document file is missing")
}

const uploadedDocument  = await uploadOnCloudinary(documentLocalPath)

if(!uploadedDocument ?.url){
  throw new apiError(400," Error while uploading document")
}

const provider = await Provider.findByIdAndUpdate(
  currentProvider._id,
  {
    $set: {
      documents: [
            {
              documentType: 'identity',
              documentUrl: uploadedDocument.url,
            },
          ],
    }
  },{new:true}
)
 return res
 .status(200)
 .json(new ApiResponse(200,provider,"Document Updated Successfully"))
})

const getcurrentProvider = asyncHandler(async(req,res)=>{
  const currentProvider = await Provider.findOne({
    user: req.user._id
  }).populate("businessCategory")

  if(!currentProvider){
    throw new apiError(404,"Provider not found")
  }
  return res
  .status(200)
  .json(new ApiResponse(200,currentProvider,"Current Provider"))

})

const getProviderById = asyncHandler(async (req,res) => {
  const {id} = req.params;

    if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, 'Invalid provider Id');
  }

  const provider = await Provider.findById(id).populate("businessCategory")
  if(!provider){
    throw new apiError(404,"Provider not found")
  }
  return res
  .status(200)
  .json(new ApiResponse(200,provider,"Provider fetched successfully"))


})

// TODO:
// Support multiple document uploads
// Replace single-file multer config with upload.fields()
// Add document type validation
// Allow document replacement/removal
export { 
  providerUser,
  updateProviderDetail,
  updateProviderDocument,
  getcurrentProvider,
  getProviderById
};
