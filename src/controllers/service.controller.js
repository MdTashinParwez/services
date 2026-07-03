import mongoose from 'mongoose';
import { Provider } from '../models/provider.model.js';
import { Category } from '../models/category.model.js';
import { Service } from '../models/service.model.js';
import { apiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const createService = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    price,
    duration,
    location,
    serviceType,
    tags,
    customFields,
  } = req.body;

  if (!req.user?._id) {
    throw new apiError(401, 'Unauthorized request');
  }

  if (!title?.trim() || !description?.trim() || !category || !price || !duration) {
    throw new apiError(400, 'Title, description, category, price, and duration are required');
  }

  if (!mongoose.isValidObjectId(category)) {
    throw new apiError(400, 'Invalid category id');
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new apiError(404, 'Category not found');
  }

  const currentProvider = await Provider.findOne({ user: req.user._id });
  if (!currentProvider) {
    throw new apiError(404, 'Provider not found');
  }

 
});