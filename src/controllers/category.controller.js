import mongoose from "mongoose";
import { Category } from "../models/category.model.js";
import { apiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import redisClient from "../utils/redis.js";


const createCategory = asyncHandler(async (req, res) => {
  const { name, description, subcategories } = req.body;

  if (!name?.trim()) {
    throw new apiError(400, "Category name is required");
  }

  const slug = name.trim().toLowerCase().replace(/\s+/g, "-");

  const existingCategory = await Category.findOne({
    $or: [
      { name: name.trim() },
      { slug }
    ]
  });

  if (existingCategory) {
    throw new apiError(409, "Category already exists");
  }

  const category = await Category.create({
    name: name.trim(),
    slug,
    description,
    subcategories
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        category,
        "Category created successfully"
      )
    );
});

const getAllCategories = asyncHandler(async (req, res) => {
  const cacheKey = "categories:all";

  let cachedCategories = null;

  // Redis GET
  try {
    cachedCategories = await redisClient.get(cacheKey);
  } catch (error) {
    console.error("Redis cache read failed:", error);
  }

  if (cachedCategories) {

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          JSON.parse(cachedCategories),
          "Categories fetched successfully"
        )
      );
  }

  // Cache MISS
  const categories = await Category.find({
    isActive: true
  })
    .sort({ name: 1 })
    .select(
      "name slug description subcategories serviceCount"
    );

  // Store result in Redis
  try {
    await redisClient.set(
      cacheKey,
      JSON.stringify(categories),
      {
        EX: 60
      }
    );
  } catch (error) {
    console.error("Redis cache write failed:", error);
  }

  // Return response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        categories,
        "Categories fetched successfully"
      )
    );
});

const getCategoryById = asyncHandler(async (req, res) => {

  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid category id");
  }

  const category = await Category.findOne({
    _id: id,
    isActive: true
  });

  if (!category) {
    throw new apiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        category,
        "Category fetched successfully"
      )
    );
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    subcategories,
    isActive
  } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid category id");
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new apiError(404, "Category not found");
  }

  if (name !== undefined) {

    const cleanName = name.trim();

    if (!cleanName) {
      throw new apiError(400, "Category name cannot be empty");
    }

    const slug = cleanName.toLowerCase().replace(/\s+/g, "-");

    const duplicate = await Category.findOne({
      _id: { $ne: id },
      $or: [
        { name: cleanName },
        { slug }
      ]
    });

    if (duplicate) {
      throw new apiError(409, "Category already exists");
    }

    category.name = cleanName;
    category.slug = slug;
  }

  if (description !== undefined) {
    category.description = description;
  }

  if (subcategories !== undefined) {
    category.subcategories = subcategories;
  }

  if (isActive !== undefined) {
    category.isActive = isActive;
  }

  await category.save();

  // Invalidate cache after successful DB update
  try {
    await redisClient.del("categories:all");
  } catch (error) {
    console.error("Redis cache invalidation failed:", error);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        category,
        "Category updated successfully"
      )
    );
});


const deleteCategory = asyncHandler(async (req, res) => {

  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid category id");
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new apiError(404, "Category not found");
  }

  // Soft delete
  category.isActive = false;

  await category.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Category deleted successfully"
      )
    );
});


export {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};