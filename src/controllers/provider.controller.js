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
        { provider: populatedProvider, },
         "Provider application submitted successfully"
      )
    );
});


const updateProviderDetail = asyncHandler(async (req, res) => {
  const { businessName, businessDescription, businessCategory } = req.body;

  const currentProvider = await Provider.findOne({
    user: req.user._id,
  });

  if (!currentProvider) {
    throw new apiError(404, "Provider not found");
  }

  const updateFields = {};

  // Business name
  if (businessName !== undefined) {
    if (!businessName.trim()) {
      throw new apiError(400, "Business name cannot be empty");
    }

    const normalizedBusinessName = businessName.trim().toLowerCase();

    const existingProviderName = await Provider.findOne({
      _id: { $ne: currentProvider._id },
      businessName: normalizedBusinessName,
    });

    if (existingProviderName) {
      throw new apiError(
        409,
        "Provider with this business name already exists"
      );
    }

    updateFields.businessName = normalizedBusinessName;
  }

  // Business description
  if (businessDescription !== undefined) {
    if (!businessDescription.trim()) {
      throw new apiError(400, "Business description cannot be empty");
    }

    updateFields.businessDescription = businessDescription.trim();
  }

  // Business category
  if (businessCategory !== undefined) {
    if (!mongoose.isValidObjectId(businessCategory)) {
      throw new apiError(400, "Invalid business category");
    }

    const category = await Category.findById(businessCategory);

    if (!category) {
      throw new apiError(404, "Business category not found");
    }

    updateFields.businessCategory = businessCategory;
  }

  const provider = await Provider.findByIdAndUpdate(
    currentProvider._id,
    {
      $set: updateFields,
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate("businessCategory");

  if (!provider) {
    throw new apiError(404, "Provider not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      provider,
      "Provider details updated successfully"
    )
  );
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

  const provider = await Provider.findById(id).populate("businessCategory").select(
    "businessName businessDescription businessCategory isVerified averageRating totalReviews responseTime"
  );
  if(!provider){
    throw new apiError(404,"Provider not found")
  }
  return res
  .status(200)
  .json(new ApiResponse(200,provider,"Provider fetched successfully"))


 }) 
 //  Future Improvement:
// Create separate public provider response.
// Never expose documents, earnings, or internal provider data in public APIs.
// Use .select() to whitelist fields returned to clients.

// TODO:
// Support multiple document uploads
// Replace single-file multer config with upload.fields()
// Add document type validation
// Allow document replacement/removal



const getAllProviders = asyncHandler(async(req,res)=>{

      const page = Math.max(parseInt(req.query.page) || 1,1);
      const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 20);
      const search = req.query.search || "";
      const category = req.query.category;

      const skip = (page-1) * limit;

      const query = {
        isApproved: true
      };

      if( category && !mongoose.isValidObjectId(category)){
        throw new apiError(400,"Invalid category")
      }
      if(search){
        query.businessName = {
          $regex: search, 
          $options: "i" 
        };
      }

      if(category){
        query.businessCategory = category;
      }


      const totalProviders = await Provider.countDocuments(query);

      const providers = await Provider.find(query)
      .populate("businessCategory")
      .skip(skip)
      .limit(limit)
      .sort({createdAt: -1})
      .select("businessName businessDescription businessCategory isVerified")

      const totalPages = Math.ceil(totalProviders / limit);

      return res.status(200).json(
        new ApiResponse(
          200,{
              providers,
              currentPage: page,
              totalPages,
              totalProviders,
          },
           "Providers fetched successfully"
        )
      )

  

  
})

const getProviderStatus = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const provider = await Provider.findOne({
    user: req.user._id,
  }).select(
    "businessName businessCategory isVerified isApproved createdAt"
  );

  if (!provider) {
    throw new apiError(404, "Provider not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        provider,
      },
      "Provider status fetched successfully"
    )
  );
});




export { 
  providerUser,
  updateProviderDetail,
  updateProviderDocument,
  getcurrentProvider,
  getProviderById,
  getAllProviders,
  getProviderStatus,
};
