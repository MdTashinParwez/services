import mongoose from 'mongoose';
import { Provider } from '../models/provider.model.js';
import { Category } from '../models/category.model.js';
import { Service } from '../models/service.model.js';
import { apiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import redisClient from "../utils/redis.js";


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

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new apiError(404, 'Category not found');
  }

  const currentProvider = await Provider.findOne({ user: req.user._id });
  if (!currentProvider) {
    throw new apiError(404, 'Provider not found');
  }
  
  // turn on after v2
  
//   if (!currentProvider.isApproved) {
//   throw new apiError(
//     403,
//     "Your provider account is pending approval. You cannot create services yet."
//   );
// }


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

const updateService = asyncHandler(async (req, res) => {
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
    throw new apiError(401, "Unauthorized request");
  }

  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid Id");
  }

  const service = await Service.findById(id);

  if (!service) {
    throw new apiError(404, "No Service found");
  }

  const currentProvider = await Provider.findOne({
    user: req.user._id,
  });

  if (!currentProvider) {
    throw new apiError(404, "provide not found");
  }

  if (
    service.provider.toString() != currentProvider._id.toString()
  ) {
    throw new apiError(
      403,
      "You are not allowed to update this service"
    );
  }

  // Category existence check is business/DB validation
  if (category !== undefined) {
    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
      throw new apiError(404, "Category not found");
    }
  }

  // Location + serviceType business rule
  const finalServiceType = serviceType ?? service.serviceType;
  const finalLocation = location ?? service.location;

  if (
    (finalServiceType === "onsite" ||
      finalServiceType === "hybrid") &&
    !finalLocation?.trim()
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

  if (title !== undefined) {
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
      ? tags.map((tag) => tag.trim().toLowerCase())
      : [];
  }

  if (customFields !== undefined) {
    updateData.customFields = customFields;
  }

  updateData.images = imageUrls;

  const updatedService = await Service.findByIdAndUpdate(
    id,
    updateData,
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
      updatedService,
      "Service updated successfully"
    )
  );
});
const getMyService = asyncHandler(async (req,res) => {

  if(!req.user?._id){
      throw new apiError(401, "Unauthorized request");
  }

  const currentProvider = await Provider.findOne({ user: req.user._id });
  if (!currentProvider) {
    throw new apiError(404, 'Provider not found');
  }
  const currentProviderService = await Service.find({
    provider: currentProvider._id
  }).populate("category","name slug")
  .sort({   createdAt:-1 })
  return res.status(200).json( 
   new ApiResponse(
    200,
    currentProviderService,
    "Services fetched successfully"
)
)

})    

const getServiceById = asyncHandler(async(req,res)=>{
   const {id} = req.params

   if(!mongoose.isValidObjectId(id)){
    throw new apiError(400,"Invalid Service Id");
   }
  const service = await Service.findOne({
    _id: id,
    isActive: true
  }).populate({
    path: "provider",
     match:{
        isApproved:true,    // improve use aggrigaiton 
    }
  }).populate("category","name slug")


  if(!service){
        throw new apiError(404,"No Service Found");

  }
    if (!service.provider) {
    throw new apiError(404, "Provider is not approved");
  }
  return res.status(200).json(
    new ApiResponse(200, service,"Service fetched successfully")
  )
  

})

const getAllServices = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);

  const limit = Math.min(
    Math.max(parseInt(req.query.limit) || 10, 1),
    20
  );

  const {
    search = "",
    category = "",
    serviceType = "",
    city = "",
    minPrice,
    maxPrice,
    sort = "newest",
  } = req.query;

  const skip = (page - 1) * limit;

  // Validate serviceType
  const allowedServiceTypes = ["online", "onsite", "hybrid"];

  if (
    serviceType &&
    !allowedServiceTypes.includes(serviceType.toLowerCase())
  ) {
    throw new apiError(400, "Invalid service type");
  }

  // Validate price
  const parsedMinPrice =
    minPrice !== undefined ? Number(minPrice) : undefined;

  const parsedMaxPrice =
    maxPrice !== undefined ? Number(maxPrice) : undefined;

  if (
    (minPrice !== undefined && !Number.isFinite(parsedMinPrice)) ||
    (maxPrice !== undefined && !Number.isFinite(parsedMaxPrice))
  ) {
    throw new apiError(400, "Invalid price value");
  }

  if (
    parsedMinPrice !== undefined &&
    parsedMinPrice < 0
  ) {
    throw new apiError(400, "Minimum price cannot be negative");
  }

  if (
    parsedMaxPrice !== undefined &&
    parsedMaxPrice < 0
  ) {
    throw new apiError(400, "Maximum price cannot be negative");
  }

  if (
    parsedMinPrice !== undefined &&
    parsedMaxPrice !== undefined &&
    parsedMinPrice > parsedMaxPrice
  ) {
    throw new apiError(
      400,
      "Minimum price cannot be greater than maximum price"
    );
  }

  // Validate sort
  const allowedSorts = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1, reviewCount: -1 },
  };

  if (!allowedSorts[sort]) {
    throw new apiError(400, "Invalid sort option");
  }
  // Resolve category slug
  let categoryId = null;

  if (category) {
    const categoryDoc = await Category.findOne({
      slug: category.toLowerCase(),
      isActive: true,
    }).select("_id");

    if (!categoryDoc) {
      throw new apiError(404, "Category not found");
    }

    categoryId = categoryDoc._id;
  }

  // Build query
  const query = {
    isActive: true,
  };

  // Search
  if (search.trim()) {
    query.$or = [
      {
        title: {
          $regex: search.trim(),
          $options: "i",
        },
      },
      {
        description: {
          $regex: search.trim(),
          $options: "i",
        },
      },
      {
        tags: {
          $regex: search.trim(),
          $options: "i",
        },
      },
    ];
  }

  // Category
  if (categoryId) {
    query.category = categoryId;
  }

  // Service type
  if (serviceType) {
    query.serviceType = serviceType.toLowerCase();
  }

  // City
  if (city.trim()) {
    query["location.city"] = {
      $regex: `^${city.trim()}$`,
      $options: "i",
    };
  }

  // Price range
  if (
    parsedMinPrice !== undefined ||
    parsedMaxPrice !== undefined
  ) {
    query.price = {};

    if (parsedMinPrice !== undefined) {
      query.price.$gte = parsedMinPrice;
    }

    if (parsedMaxPrice !== undefined) {
      query.price.$lte = parsedMaxPrice;
    }
  }

  // Redis cache
  const cacheKey = [
    "services",
    `page:${page}`,
    `limit:${limit}`,
    `search:${search.trim().toLowerCase()}`,
    `category:${category.toLowerCase()}`,
    `serviceType:${serviceType.toLowerCase()}`,
    `city:${city.trim().toLowerCase()}`,
    `minPrice:${parsedMinPrice ?? ""}`,
    `maxPrice:${parsedMaxPrice ?? ""}`,
    `sort:${sort}`,
  ].join(":");
  let cachedServices = null;
  // BENCHMARK: Redis BYPASS for testing
  // try {
  //   cachedServices = await redisClient.get(cacheKey);
  // } catch (error) {
  //   console.error("Redis cache read failed:", error);
  // }

  if (cachedServices) {

    console.log("CACHE HIT:", cacheKey);

    return res.status(200).json(
      new ApiResponse(
        200,
        JSON.parse(cachedServices),
        "Services fetched successfully"
      )
    );
  }

  // DB query
  const [totalServices, services] = await Promise.all([
    Service.countDocuments(query),

    Service.find(query)
      .populate("provider", "businessName isVerified")
      .populate("category", "name slug")
      .sort(allowedSorts[sort])
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.ceil(totalServices / limit);

  const responseData = {
    services,
    currentPage: page,
    totalPages,
    totalServices,
  };


  // try {
  //   await redisClient.set(
  //     cacheKey,
  //     JSON.stringify(responseData),
  //     "EX",
  //     600
  //   );
  // } catch (error) {
  //   console.error("Redis cache write failed:", error);
  // }

    console.log("CACHE MISS:", cacheKey);
  return res.status(200).json(
    new ApiResponse(
      200,
      responseData,
      "Services fetched successfully"
    )
  );
});

const getNearbyServices = asyncHandler(async (req, res) => {
  const longitude = Number(req.query.longitude);
  const latitude = Number(req.query.latitude);
  const radius = Number(req.query.radius) || 10;

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new apiError(
      400,
      "Valid longitude and latitude are required"
    );
  }

  if (longitude < -180 || longitude > 180) {
    throw new apiError(400, "Invalid longitude");
  }

  if (latitude < -90 || latitude > 90) {
    throw new apiError(400, "Invalid latitude");
  }

  if (!Number.isFinite(radius) || radius <= 0 || radius > 100) {
    throw new apiError(
      400,
      "Radius must be between 1 and 100 km"
    );
  }

  const radiusInMeters = radius * 1000;

  const services = await Service.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        key: "location",
        distanceField: "distanceInMeters",
        maxDistance: radiusInMeters,
        spherical: true,
        query: {
          isActive: true,
        },
      },
    },

    {
      $sort: {
        distanceInMeters: 1,
      },
    },

    {
      $limit: 20,
    },

    {
      $lookup: {
        from: "providers",
        localField: "provider",
        foreignField: "_id",
        as: "provider",
      },
    },

    {
      $unwind: "$provider",
    },

    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },

    {
      $unwind: "$category",
    },

    {
      $addFields: {
        distanceInKm: {
          $round: [
            { $divide: ["$distanceInMeters", 1000] },
            2,
          ],
        },
      },
    },

    {
      $project: {
        title: 1,
        description: 1,
        price: 1,
        currency: 1,
        images: 1,
        duration: 1,
        serviceType: 1,
        rating: 1,
        reviewCount: 1,
        bookingCount: 1,
        location: 1,
        distanceInKm: 1,

        "provider._id": 1,
        "provider.businessName": 1,
        "provider.isVerified": 1,

        "category._id": 1,
        "category.name": 1,
        "category.slug": 1,
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        services,
        count: services.length,
        radius,
      },
      "Nearby services fetched successfully"
    )
  );
});
const deleteService = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid service id");
  }

  const service = await Service.findById(id);

  if (!service) {
    throw new apiError(404, "Service not found");
  }

  const currentProvider = await Provider.findOne({
    user: req.user._id,
  });

  if (!currentProvider) {
    throw new apiError(404, "Provider not found");
  }

  if (service.provider.toString() !== currentProvider._id.toString()) {
    throw new apiError(
      403,
      "You are not allowed to delete this service"
    );
  }

  // Decrease category service count
  await Category.findByIdAndUpdate(service.category, {
    $inc: {
      serviceCount: -1,
    },
  });

  // Delete service
  await service.deleteOne();

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      "Service deleted successfully"
    )
  );
});  

export{
  createService,
  updateService,
  getMyService,
  getServiceById,
  getAllServices,
  getNearbyServices,
  deleteService
}