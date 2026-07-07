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


   const parsedPrice = Number(price);
   if (isNaN(parsedPrice) || parsedPrice <= 0) {
    throw new apiError(400, "Price is Invalid ");
  }

  if (Number(duration) <= 0) {
    throw new apiError(400, "Duration must be greater than 0");
  }
  const allowedTypes = ["online","onsite","hybrid"];

  if(!allowedTypes.includes(serviceType)){
        throw new apiError(400, "Invalid service type");
    }
    if ((serviceType === "onsite" || serviceType === "hybrid") &&!location ) {
    throw new apiError( 400,
      "Location is required for onsite and hybrid services"
    );
  }

  const imageFiles = req.files?.images || [];
  const imageUrls = [];

  for (const file of imageFiles) {
    const uploadedImage = await uploadOnCloudinary(file.path);

    if (!uploadedImage?.url) {
      throw new apiError(500, "Image upload failed");
    }

    imageUrls.push(uploadedImage.url);
  }
  // TODO: trancation
   const service = await Service.create({
    provider: currentProvider._id,
    title: title.trim(),
    description: description.trim(),
    category,
    price: Number(price),
    duration: Number(duration),
    serviceType,
    location,
    images: imageUrls,
    tags: Array.isArray(tags)
      ? tags.map((tag) => tag.trim().toLowerCase())
      : [],
    customFields,
  })
    await Category.findByIdAndUpdate(category, {
    $inc: {
      serviceCount: 1,
    },
  });

  const createdService = await Service.findById(service._id)
    .populate("provider", "businessName isVerified")
    .populate("category", "name slug");

  return res.status(201).json(
    new ApiResponse(
      201,
      createdService,
      "Service created successfully"
    )
  );


 
});

const UpdateService = asyncHandler(async (req,res) => {
  
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

  const {id} = req.params;

  if(!mongoose.isValidObjectId(id)){
    throw new apiError(400,"Invalid Id")
  }

const service = await Service.findById(id); // yaha se id, provider, sab k access miljayga  us servic database m id se 

 if(!service){
      throw new apiError(404,"No Service found")
 }

 const currentProvider = await Provider.findOne({
  user: req.user._id,
 })
 if(!currentProvider){
  throw new apiError(404, "provide not found");
 }
 if (service.provider.toString() != currentProvider._id.toString()){
    throw new apiError(403, "You are not allowed to update this service");

 }
  if (title !== undefined && !title.trim()) {
    throw new apiError(400, "Title cannot be empty");
  }

  if (description !== undefined && !description.trim()) {
    throw new apiError(400, "Description cannot be empty");
  }

  if (category !== undefined) {
    if (!mongoose.isValidObjectId(category)) {
      throw new apiError(400, "Invalid category");
    }

    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
      throw new apiError(404, "Category not found");
    }
  }

  if (price !== undefined) {
    const parsedPrice = Number(price);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      throw new apiError(400, "Invalid price");
    }
  }

  if (duration !== undefined) {
    const parsedDuration = Number(duration);

    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      throw new apiError(400, "Invalid duration");
    }
  }

  if (serviceType !== undefined) {
    const allowedTypes = ["online", "onsite", "hybrid"];

    if (!allowedTypes.includes(serviceType)) {
      throw new apiError(400, "Invalid service type");
    }
  }

  if (
    (serviceType === "onsite" || serviceType === "hybrid") &&
    location === undefined
  ) {
    throw new apiError(
      400,
      "Location is required for onsite and hybrid services"
    );
  }

  // IMAGES
  let imageUrls = service.images;

  const imageFiles = req.files?.images || [];

  if (imageFiles.length > 0) {
    imageUrls = [];

    for (const file of imageFiles) {
      const uploadedImage = await uploadOnCloudinary(file.path);

      if (!uploadedImage?.url) {
        throw new apiError(500, "Image upload failed");
      }

      imageUrls.push(uploadedImage.url);
    }
  }

  // update 
  const updateData = {};

  if(title !== undefined){
    updateData.title = title.trim();
  }
  if (description !== undefined) {
    updateData.description = description.trim();
  }

  if (category !== undefined) {
    updateData.category = category;
  }

  if (price !== undefined) {
    updateData.price = Number(price);
  }

  if (duration !== undefined) {
    updateData.duration = Number(duration);
  }

  if (location !== undefined) {
    updateData.location = location;
  }

  if (serviceType !== undefined) {
    updateData.serviceType = serviceType;
  }

  if (tags !== undefined) {
    updateData.tags = Array.isArray(tags)
      ? tags.map(tag => tag.trim().toLowerCase())
      : [];
  }

  if (customFields !== undefined) {
    updateData.customFields = customFields;
  }

  updateData.images = imageUrls;

  const updateService = await Service.findByIdAndUpdate(
    id,updateData,
    {
      new: true, 
      runValidators: true,

    }
  )
    .populate("provider", "businessName isVerified")
    .populate("category", "name slug");

 return res.status(200).json(
  new ApiResponse(
    200,
    updateService,
    "Service updated successfully"
  )
);


})



export{
  createService
}