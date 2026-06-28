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

const updateProviderDetail = asyncHandler(async (req, res) => {
  //get current provider
  // validate input
  // check category input
  // bussines name
  // check duplickate
  // updat
  // return updated provider
  const { businessName, businessDescription, businessCategory } = req.body;

  if (!mongoose.isValidObjectId(businessCategory)) {
    throw new apiError(400, 'Invalid business category');
  }

  const category = await Category.findById(businessCategory);

  if (!category) {
    throw new apiError(404, 'Business category not found');
  }

  const existingProviderName = await Provider.findOne({
    $or: [{ businessName: businessName.toLowerCase() }],
  });

  if (existingProviderName) {
    throw new apiError(409, 'Provider with this name is already exists');
  }

  const currentProvider = await Provider.findOne({
    user: provider._id,
  });
  const existingProvider = await Provider.findOne({
    id: { $ne: currentProvider._id },
    $or: [{ businessName }],
  });
  if (existingProvider) {
    throw new apiError(409, 'Provider with this name is already exist');
  }
  const provider = await Provider.findByIdAndUpdate(
    currentProvider._id,
    {
      $set: {
        businessName: busingessName.toLowerCase(), // also here check if name is already taken
        businessDescription: businessDescription,
        businessCategory, //: ( todo check the mongo if ther user category belong to the category or naot  )
      },
    },
    {
      new: true,
    }
  ).select('-password');
  return res.status(200).json(new ApiResponse(200, user, 'Account details updated successfully'));
});

export { providerUser };
