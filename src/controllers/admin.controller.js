import mongoose from "mongoose";
import fs from "fs";
import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import redisClient from "../utils/redis.js";

import { User } from "../models/user.model.js";
import { Provider } from "../models/provider.model.js";
import { Service } from "../models/service.model.js";
import { Booking } from "../models/booking.model.js";
import { Payment } from "../models/payment.model.js";
import { Category } from "../models/category.model.js";
import { Notification } from "../models/notification.model.js";
import { BookingSlot } from "../models/BookingSlot.model.js";
import { AdminLog } from "../models/admin.model.js";

// Helper: Safely remove temporary file
const safeUnlink = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Failed to clean up temp file:", err);
    }
  }
};

// Helper: Invalidate Category Redis Cache
const clearCategoryCache = async () => {
  try {
    await redisClient.del("categories:all");
  } catch (err) {
    console.error("Redis category cache clear failed:", err);
  }
};

// Helper: Invalidate Service Redis Cache
const clearServiceCache = async () => {
  try {
    const keys = await redisClient.keys("services:*");
    if (keys && keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (err) {
    console.error("Redis service cache clear failed:", err);
  }
};

// Helper: Log Admin Action
const logAdminAction = async ({
  adminId,
  action,
  targetType,
  targetId,
  details = {},
  reason = "",
  ipAddress = "",
}) => {
  try {
    await AdminLog.create({
      admin: adminId,
      action,
      targetType,
      targetId,
      details,
      reason,
      ipAddress,
    });
  } catch (err) {
    console.error("Failed to write admin log:", err);
  }
};

// ==========================================
// 1. DASHBOARD & ANALYTICS
// ==========================================

const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    customersCount,
    providersUserCount,
    adminsCount,
    totalProviders,
    pendingProviders,
    approvedProviders,
    totalServices,
    activeServices,
    totalBookings,
    completedBookings,
    pendingBookings,
    cancelledBookings,
    revenueData,
    recentBookings,
    pendingProviderApplications,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "provider" }),
    User.countDocuments({ role: "admin" }),
    Provider.countDocuments(),
    Provider.countDocuments({ isApproved: false }),
    Provider.countDocuments({ isApproved: true }),
    Service.countDocuments(),
    Service.countDocuments({ isActive: true }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: "completed" }),
    Booking.countDocuments({ status: "pending" }),
    Booking.countDocuments({ status: "cancelled" }),
    Payment.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]),
    Booking.find()
      .populate("customer", "username email phone")
      .populate("provider", "businessName")
      .populate("service", "title price")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Provider.find({ isApproved: false })
      .populate("user", "username email phone")
      .populate("businessCategory", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users: {
          total: totalUsers,
          customers: customersCount,
          providers: providersUserCount,
          admins: adminsCount,
        },
        providers: {
          total: totalProviders,
          pending: pendingProviders,
          approved: approvedProviders,
        },
        services: {
          total: totalServices,
          active: activeServices,
          inactive: totalServices - activeServices,
        },
        bookings: {
          total: totalBookings,
          completed: completedBookings,
          pending: pendingBookings,
          cancelled: cancelledBookings,
        },
        financials: {
          totalRevenue,
          currency: "INR",
        },
        recentBookings,
        pendingProviderApplications,
      },
      "Admin dashboard stats retrieved successfully"
    )
  );
});

// ==========================================
// 2. PROVIDER MANAGEMENT
// ==========================================

const getProviderApplications = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const { status, search, category, isVerified } = req.query;

  const query = {};

  if (status === "pending") {
    query.isApproved = false;
  } else if (status === "approved") {
    query.isApproved = true;
  }

  if (isVerified !== undefined) {
    query.isVerified = isVerified === "true";
  }

  if (category && mongoose.isValidObjectId(category)) {
    query.businessCategory = category;
  }

  if (search && search.trim()) {
    query.businessName = {
      $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  const [totalProviders, providers] = await Promise.all([
    Provider.countDocuments(query),
    Provider.find(query)
      .populate("user", "username email phone avatar createdAt")
      .populate("businessCategory", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        providers,
        currentPage: page,
        totalPages: Math.ceil(totalProviders / limit),
        totalProviders,
      },
      "Provider applications retrieved successfully"
    )
  );
});

const getProviderDetailsAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid provider ID");
  }

  const provider = await Provider.findById(id)
    .populate("user", "username email phone avatar role isVerified createdAt")
    .populate("businessCategory", "name slug");

  if (!provider) {
    throw new apiError(404, "Provider not found");
  }

  const [servicesCount, bookingsCount] = await Promise.all([
    Service.countDocuments({ provider: provider._id }),
    Booking.countDocuments({ provider: provider._id }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        provider,
        servicesCount,
        bookingsCount,
      },
      "Provider details retrieved successfully"
    )
  );
});

const approveProvider = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { verifyIdentity = true, note = "" } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid provider ID");
  }

  const provider = await Provider.findById(id);

  if (!provider) {
    throw new apiError(404, "Provider not found");
  }

  if (provider.isApproved) {
    throw new apiError(400, "Provider is already approved");
  }

  // Update provider status
  provider.isApproved = true;
  if (verifyIdentity) {
    provider.isVerified = true;
    if (provider.documents && provider.documents.length > 0) {
      provider.documents.forEach((doc) => {
        doc.verified = true;
      });
    }
  }

  await provider.save();

  // Update User role to "provider"
  await User.findByIdAndUpdate(provider.user, {
    $set: {
      role: "provider",
      isVerified: true,
    },
  });

  // Notify Provider
  await Notification.create({
    recipient: provider.user,
    sender: req.user._id,
    type: "provider_verified",
    title: "Application Approved!",
    message: "Congratulations! Your service provider application has been approved. You can now create and manage services.",
    data: {
      providerId: provider._id,
    },
    priority: "high",
  });

  // Real-time socket notification
  const io = req.app.get("io");
  if (io) {
    io.to(`user:${provider.user}`).emit("provider-approved", {
      providerId: provider._id,
      message: "Your provider application has been approved",
    });
  }

  // Log admin action
  await logAdminAction({
    adminId: req.user._id,
    action: "APPROVE_PROVIDER",
    targetType: "Provider",
    targetId: provider._id,
    details: { businessName: provider.businessName, verifyIdentity },
    reason: note,
    ipAddress: req.ip,
  });

  const updatedProvider = await Provider.findById(provider._id)
    .populate("user", "username email role")
    .populate("businessCategory", "name");

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedProvider,
      "Provider application approved successfully"
    )
  );
});

const rejectProvider = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid provider ID");
  }

  if (!rejectionReason || !rejectionReason.trim()) {
    throw new apiError(400, "Rejection reason is required");
  }

  const provider = await Provider.findById(id);

  if (!provider) {
    throw new apiError(404, "Provider not found");
  }

  provider.isApproved = false;
  provider.isVerified = false;
  await provider.save();

  // Notify user
  await Notification.create({
    recipient: provider.user,
    sender: req.user._id,
    type: "system_alert",
    title: "Provider Application Rejected",
    message: `Your provider application was not approved. Reason: ${rejectionReason.trim()}`,
    data: {
      providerId: provider._id,
    },
    priority: "high",
  });

  // Real-time socket notification
  const io = req.app.get("io");
  if (io) {
    io.to(`user:${provider.user}`).emit("provider-rejected", {
      providerId: provider._id,
      reason: rejectionReason.trim(),
    });
  }

  // Log admin action
  await logAdminAction({
    adminId: req.user._id,
    action: "REJECT_PROVIDER",
    targetType: "Provider",
    targetId: provider._id,
    details: { businessName: provider.businessName },
    reason: rejectionReason.trim(),
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      provider,
      "Provider application rejected successfully"
    )
  );
});

const toggleProviderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = "" } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid provider ID");
  }

  const provider = await Provider.findById(id);

  if (!provider) {
    throw new apiError(404, "Provider not found");
  }

  const newStatus = !provider.isApproved;
  provider.isApproved = newStatus;
  await provider.save();

  // If suspended, deactivate their services
  if (!newStatus) {
    await Service.updateMany(
      { provider: provider._id },
      { $set: { isActive: false } }
    );
    await clearServiceCache();
  }

  await logAdminAction({
    adminId: req.user._id,
    action: newStatus ? "REACTIVATE_PROVIDER" : "SUSPEND_PROVIDER",
    targetType: "Provider",
    targetId: provider._id,
    details: { isApproved: newStatus },
    reason,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      provider,
      `Provider status updated to ${newStatus ? "approved/active" : "suspended"}`
    )
  );
});

// ==========================================
// 3. USER MANAGEMENT
// ==========================================

const getAllUsersAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const { role, search, isVerified } = req.query;

  const query = {};

  if (role && ["customer", "provider", "admin"].includes(role)) {
    query.role = role;
  }

  if (isVerified !== undefined) {
    query.isVerified = isVerified === "true";
  }

  if (search && search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { username: { $regex: escapedSearch, $options: "i" } },
      { email: { $regex: escapedSearch, $options: "i" } },
      { phone: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const [totalUsers, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query)
      .select("-refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
      },
      "Users retrieved successfully"
    )
  );
});

const getUserDetailsAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid user ID");
  }

  const user = await User.findById(id).select("-refreshToken");

  if (!user) {
    throw new apiError(404, "User not found");
  }

  const [providerProfile, bookings, payments] = await Promise.all([
    Provider.findOne({ user: user._id }).populate("businessCategory", "name"),
    Booking.find({ customer: user._id })
      .populate("service", "title price")
      .populate("provider", "businessName")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Payment.find({ customer: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        providerProfile,
        recentBookings: bookings,
        recentPayments: payments,
      },
      "User details retrieved successfully"
    )
  );
});

const updateUserRoleAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, reason = "" } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid user ID");
  }

  const allowedRoles = ["customer", "provider", "admin"];
  if (!allowedRoles.includes(role)) {
    throw new apiError(400, "Invalid role. Must be 'customer', 'provider', or 'admin'");
  }

  const user = await User.findById(id);

  if (!user) {
    throw new apiError(404, "User not found");
  }

  if (user._id.toString() === req.user._id.toString() && role !== "admin") {
    throw new apiError(400, "You cannot remove your own admin privileges");
  }

  const oldRole = user.role;
  user.role = role;
  await user.save({ validateBeforeSave: false });

  await logAdminAction({
    adminId: req.user._id,
    action: "UPDATE_USER_ROLE",
    targetType: "User",
    targetId: user._id,
    details: { oldRole, newRole: role },
    reason,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { _id: user._id, username: user.username, role: user.role },
      `User role updated from ${oldRole} to ${role}`
    )
  );
});

const deleteUserAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = "" } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid user ID");
  }

  if (id === req.user._id.toString()) {
    throw new apiError(400, "You cannot delete your own admin account");
  }

  const user = await User.findById(id);

  if (!user) {
    throw new apiError(404, "User not found");
  }

  // Remove linked provider & services if applicable
  const linkedProvider = await Provider.findOne({ user: user._id });
  if (linkedProvider) {
    await Service.deleteMany({ provider: linkedProvider._id });
    await linkedProvider.deleteOne();
    await clearServiceCache();
  }

  await user.deleteOne();

  await logAdminAction({
    adminId: req.user._id,
    action: "DELETE_USER",
    targetType: "User",
    targetId: user._id,
    details: { username: user.username, email: user.email },
    reason,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(200, null, "User deleted successfully")
  );
});

// ==========================================
// 4. SERVICE MANAGEMENT
// ==========================================

const getAllServicesAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const { search, category, isActive, serviceType } = req.query;

  const query = {};

  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  if (serviceType) {
    query.serviceType = serviceType;
  }

  if (category && mongoose.isValidObjectId(category)) {
    query.category = category;
  }

  if (search && search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.title = { $regex: escapedSearch, $options: "i" };
  }

  const [totalServices, services] = await Promise.all([
    Service.countDocuments(query),
    Service.find(query)
      .populate("provider", "businessName isVerified isApproved")
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        services,
        currentPage: page,
        totalPages: Math.ceil(totalServices / limit),
        totalServices,
      },
      "Services retrieved successfully"
    )
  );
});

const toggleServiceStatusAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = "" } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid service ID");
  }

  const service = await Service.findById(id);

  if (!service) {
    throw new apiError(404, "Service not found");
  }

  service.isActive = !service.isActive;
  await service.save();

  await clearServiceCache();

  await logAdminAction({
    adminId: req.user._id,
    action: service.isActive ? "ACTIVATE_SERVICE" : "DEACTIVATE_SERVICE",
    targetType: "Service",
    targetId: service._id,
    details: { title: service.title, isActive: service.isActive },
    reason,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      service,
      `Service ${service.isActive ? "activated" : "deactivated"} successfully`
    )
  );
});

const deleteServiceAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = "" } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid service ID");
  }

  const service = await Service.findById(id);

  if (!service) {
    throw new apiError(404, "Service not found");
  }

  // Decrement category serviceCount
  if (service.category) {
    await Category.findByIdAndUpdate(service.category, {
      $inc: { serviceCount: -1 },
    });
  }

  await service.deleteOne();

  await clearServiceCache();

  await logAdminAction({
    adminId: req.user._id,
    action: "DELETE_SERVICE",
    targetType: "Service",
    targetId: service._id,
    details: { title: service.title, provider: service.provider },
    reason,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Service deleted successfully by admin")
  );
});

// ==========================================
// 5. BOOKING MANAGEMENT & RECENT BOOKINGS
// ==========================================

const getAllBookingsAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const { status, paymentStatus, startDate, endDate } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  if (startDate || endDate) {
    query.bookingDate = {};
    if (startDate) query.bookingDate.$gte = new Date(startDate);
    if (endDate) query.bookingDate.$lte = new Date(endDate);
  }

  const [totalBookings, bookings] = await Promise.all([
    Booking.countDocuments(query),
    Booking.find(query)
      .populate("customer", "username email phone")
      .populate("provider", "businessName")
      .populate("service", "title price")
      .populate("paymentId", "paymentStatus paymentMethod transactionId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bookings,
        currentPage: page,
        totalPages: Math.ceil(totalBookings / limit),
        totalBookings,
      },
      "Bookings retrieved successfully"
    )
  );
});

const getRecentBookingsAdmin = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const bookings = await Booking.find()
    .populate("customer", "username email phone")
    .populate("provider", "businessName")
    .populate("service", "title price")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return res.status(200).json(
    new ApiResponse(200, bookings, "Recent bookings fetched successfully")
  );
});

const getBookingDetailsAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid booking ID");
  }

  const booking = await Booking.findById(id)
    .populate("customer", "username email phone")
    .populate("provider", "businessName user")
    .populate("service", "title price duration serviceType")
    .populate("paymentId")
    .populate("reviewId");

  if (!booking) {
    throw new apiError(404, "Booking not found");
  }

  return res.status(200).json(
    new ApiResponse(200, booking, "Booking details retrieved successfully")
  );
});

const cancelBookingAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancellationReason = "Cancelled by platform administrator" } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid booking ID");
  }

  const booking = await Booking.findById(id);

  if (!booking) {
    throw new apiError(404, "Booking not found");
  }

  if (booking.status === "completed") {
    throw new apiError(400, "Completed bookings cannot be cancelled");
  }

  if (booking.status === "cancelled") {
    throw new apiError(400, "Booking is already cancelled");
  }

  booking.status = "cancelled";
  booking.cancelledBy = "admin";
  booking.cancellationReason = cancellationReason;
  await booking.save();

  // Release booking slots
  await BookingSlot.deleteMany({ booking: booking._id });

  // Notify customer
  await Notification.create({
    recipient: booking.customer,
    sender: req.user._id,
    type: "booking_cancelled",
    title: "Booking Cancelled by Admin",
    message: `Your booking #${booking._id} was cancelled by administration. Reason: ${cancellationReason}`,
    data: {
      bookingId: booking._id,
      serviceId: booking.service,
    },
    priority: "high",
  });

  // Notify provider
  const provider = await Provider.findById(booking.provider);
  if (provider?.user) {
    await Notification.create({
      recipient: provider.user,
      sender: req.user._id,
      type: "booking_cancelled",
      title: "Booking Cancelled by Admin",
      message: `Booking #${booking._id} was cancelled by administration. Reason: ${cancellationReason}`,
      data: {
        bookingId: booking._id,
        serviceId: booking.service,
      },
      priority: "high",
    });
  }

  await logAdminAction({
    adminId: req.user._id,
    action: "CANCEL_BOOKING",
    targetType: "Booking",
    targetId: booking._id,
    details: { totalAmount: booking.totalAmount },
    reason: cancellationReason,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(200, booking, "Booking cancelled by admin successfully")
  );
});

// ==========================================
// 6. CATEGORY CRUD OPERATIONS
// ==========================================

const createCategoryAdmin = asyncHandler(async (req, res) => {
  const { name, description, icon, subcategories, isActive = true } = req.body;

  if (!name || !name.trim()) {
    throw new apiError(400, "Category name is required");
  }

  const cleanName = name.trim();
  const slug = cleanName.toLowerCase().replace(/\s+/g, "-");

  const existingCategory = await Category.findOne({
    $or: [{ name: cleanName }, { slug }],
  });

  if (existingCategory) {
    safeUnlink(req.file?.path);
    throw new apiError(409, "Category with this name or slug already exists");
  }

  let imageUrl = req.body.image || null;

  // Handle uploaded category image if provided
  if (req.file?.path) {
    const uploadedImage = await uploadOnCloudinary(req.file.path);
    safeUnlink(req.file.path);
    if (uploadedImage?.url) {
      imageUrl = uploadedImage.url;
    }
  }

  // Parse subcategories if sent as JSON string (from form-data)
  let parsedSubcategories = [];
  if (subcategories) {
    if (Array.isArray(subcategories)) {
      parsedSubcategories = subcategories.map((s) => s.trim()).filter(Boolean);
    } else if (typeof subcategories === "string") {
      try {
        const parsed = JSON.parse(subcategories);
        parsedSubcategories = Array.isArray(parsed) ? parsed : [subcategories.trim()];
      } catch {
        parsedSubcategories = subcategories.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
  }

  const category = await Category.create({
    name: cleanName,
    slug,
    description: description?.trim() || "",
    icon: icon?.trim() || "",
    image: imageUrl,
    subcategories: parsedSubcategories,
    isActive: isActive === "true" || isActive === true,
  });

  await clearCategoryCache();

  await logAdminAction({
    adminId: req.user._id,
    action: "CREATE_CATEGORY",
    targetType: "Category",
    targetId: category._id,
    details: { name: category.name, slug: category.slug },
    ipAddress: req.ip,
  });

  return res.status(201).json(
    new ApiResponse(201, category, "Category created successfully by admin")
  );
});

const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const { search, isActive } = req.query;

  const query = {};

  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  if (search && search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
      { slug: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const [totalCategories, categories] = await Promise.all([
    Category.countDocuments(query),
    Category.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        categories,
        currentPage: page,
        totalPages: Math.ceil(totalCategories / limit),
        totalCategories,
      },
      "Categories retrieved successfully"
    )
  );
});

const getCategoryByIdAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid category ID");
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new apiError(404, "Category not found");
  }

  const associatedServicesCount = await Service.countDocuments({
    category: category._id,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        category,
        associatedServicesCount,
      },
      "Category details retrieved successfully"
    )
  );
});

const updateCategoryAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, icon, subcategories, isActive } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    safeUnlink(req.file?.path);
    throw new apiError(400, "Invalid category ID");
  }

  const category = await Category.findById(id);

  if (!category) {
    safeUnlink(req.file?.path);
    throw new apiError(404, "Category not found");
  }

  if (name !== undefined) {
    const cleanName = name.trim();
    if (!cleanName) {
      safeUnlink(req.file?.path);
      throw new apiError(400, "Category name cannot be empty");
    }

    const slug = cleanName.toLowerCase().replace(/\s+/g, "-");

    const duplicate = await Category.findOne({
      _id: { $ne: id },
      $or: [{ name: cleanName }, { slug }],
    });

    if (duplicate) {
      safeUnlink(req.file?.path);
      throw new apiError(409, "Category with this name or slug already exists");
    }

    category.name = cleanName;
    category.slug = slug;
  }

  if (description !== undefined) {
    category.description = description.trim();
  }

  if (icon !== undefined) {
    category.icon = icon.trim();
  }

  if (isActive !== undefined) {
    category.isActive = isActive === "true" || isActive === true;
  }

  if (subcategories !== undefined) {
    if (Array.isArray(subcategories)) {
      category.subcategories = subcategories.map((s) => s.trim()).filter(Boolean);
    } else if (typeof subcategories === "string") {
      try {
        const parsed = JSON.parse(subcategories);
        category.subcategories = Array.isArray(parsed) ? parsed : [subcategories.trim()];
      } catch {
        category.subcategories = subcategories.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
  }

  // Handle uploaded new image
  if (req.file?.path) {
    const uploadedImage = await uploadOnCloudinary(req.file.path);
    safeUnlink(req.file.path);
    if (uploadedImage?.url) {
      category.image = uploadedImage.url;
    }
  } else if (req.body.image !== undefined) {
    category.image = req.body.image;
  }

  await category.save();

  await clearCategoryCache();

  await logAdminAction({
    adminId: req.user._id,
    action: "UPDATE_CATEGORY",
    targetType: "Category",
    targetId: category._id,
    details: { name: category.name, slug: category.slug, isActive: category.isActive },
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(200, category, "Category updated successfully by admin")
  );
});

const deleteCategoryAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { force = false, reason = "" } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid category ID");
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new apiError(404, "Category not found");
  }

  const linkedServicesCount = await Service.countDocuments({
    category: category._id,
  });

  // Safeguard against deleting categories with active services
  if (linkedServicesCount > 0 && !force) {
    throw new apiError(
      400,
      `Cannot delete category: ${linkedServicesCount} service(s) are linked to it. Use soft delete or force delete.`
    );
  }

  await category.deleteOne();

  await clearCategoryCache();

  await logAdminAction({
    adminId: req.user._id,
    action: "DELETE_CATEGORY",
    targetType: "Category",
    targetId: category._id,
    details: { name: category.name, linkedServicesCount, force },
    reason,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Category permanently deleted successfully")
  );
});

// ==========================================
// 7. ADMIN AUDIT LOGS
// ==========================================

const getAdminAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const { action, targetType } = req.query;

  const query = {};

  if (action) {
    query.action = action;
  }

  if (targetType) {
    query.targetType = targetType;
  }

  const [totalLogs, logs] = await Promise.all([
    AdminLog.countDocuments(query),
    AdminLog.find(query)
      .populate("admin", "username email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        logs,
        currentPage: page,
        totalPages: Math.ceil(totalLogs / limit),
        totalLogs,
      },
      "Admin audit logs retrieved successfully"
    )
  );
});

export {
  // Dashboard
  getDashboardStats,

  // Provider
  getProviderApplications,
  getProviderDetailsAdmin,
  approveProvider,
  rejectProvider,
  toggleProviderStatus,

  // User
  getAllUsersAdmin,
  getUserDetailsAdmin,
  updateUserRoleAdmin,
  deleteUserAdmin,

  // Service
  getAllServicesAdmin,
  toggleServiceStatusAdmin,
  deleteServiceAdmin,

  // Booking
  getAllBookingsAdmin,
  getRecentBookingsAdmin,
  getBookingDetailsAdmin,
  cancelBookingAdmin,

  // Category
  createCategoryAdmin,
  getAllCategoriesAdmin,
  getCategoryByIdAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,

  // Audit Logs
  getAdminAuditLogs,
};
