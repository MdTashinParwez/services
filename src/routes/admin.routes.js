import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

import {
  // Dashboard
  getDashboardStats,

  // Provider Management
  getProviderApplications,
  getProviderDetailsAdmin,
  approveProvider,
  rejectProvider,
  toggleProviderStatus,

  // User Management
  getAllUsersAdmin,
  getUserDetailsAdmin,
  updateUserRoleAdmin,
  deleteUserAdmin,

  // Service Management
  getAllServicesAdmin,
  toggleServiceStatusAdmin,
  deleteServiceAdmin,

  // Booking Management
  getAllBookingsAdmin,
  getRecentBookingsAdmin,
  getBookingDetailsAdmin,
  cancelBookingAdmin,

  // Category CRUD
  createCategoryAdmin,
  getAllCategoriesAdmin,
  getCategoryByIdAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,

  // Audit Logs
  getAdminAuditLogs,
} from "../controllers/admin.controller.js";

const router = Router();

// Protect all admin routes: require authentication and 'admin' role
router.use(verifyJWT, authorizeRoles("admin"));

// ------------------------------------------
// 1. Dashboard & Analytics
// ------------------------------------------
router.get("/dashboard/stats", getDashboardStats);

// ------------------------------------------
// 2. Provider Management
// ------------------------------------------
router.get("/providers/applications", getProviderApplications);
router.get("/providers/:id", getProviderDetailsAdmin);
router.patch("/providers/:id/approve", approveProvider);
router.patch("/providers/:id/reject", rejectProvider);
router.patch("/providers/:id/toggle-status", toggleProviderStatus);

// ------------------------------------------
// 3. User Management
// ------------------------------------------
router.get("/users", getAllUsersAdmin);
router.get("/users/:id", getUserDetailsAdmin);
router.patch("/users/:id/role", updateUserRoleAdmin);
router.delete("/users/:id", deleteUserAdmin);

// ------------------------------------------
// 4. Service Management
// ------------------------------------------
router.get("/services", getAllServicesAdmin);
router.patch("/services/:id/toggle-status", toggleServiceStatusAdmin);
router.delete("/services/:id", deleteServiceAdmin);

// ------------------------------------------
// 5. Booking Management & Recent Bookings
// ------------------------------------------
router.get("/bookings", getAllBookingsAdmin);
router.get("/bookings/recent", getRecentBookingsAdmin);
router.get("/bookings/:id", getBookingDetailsAdmin);
router.patch("/bookings/:id/cancel", cancelBookingAdmin);

// ------------------------------------------
// 6. Category CRUD Operations
// ------------------------------------------
router.post("/categories", upload.single("image"), createCategoryAdmin);
router.get("/categories", getAllCategoriesAdmin);
router.get("/categories/:id", getCategoryByIdAdmin);
router.patch("/categories/:id", upload.single("image"), updateCategoryAdmin);
router.delete("/categories/:id", deleteCategoryAdmin);

// ------------------------------------------
// 7. Audit & Activity Logs
// ------------------------------------------
router.get("/logs", getAdminAuditLogs);

export default router;
