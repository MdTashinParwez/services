

const getMyNotifications = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 20);
  const skip = (page - 1) * limit;

  const totalNotifications = await Notification.countDocuments({
    receiver: req.user._id,
  });

  const notifications = await Notification.find({
    receiver: req.user._id,
  })
    .populate("sender", "fullName profileImage")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notifications,
        currentPage: page,
        totalPages: Math.ceil(totalNotifications / limit),
        totalNotifications,
      },
      "Notifications fetched successfully"
    )
  );
});

const getNotificationById = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid notification id");
  }

  const notification = await Notification.findById(id)
    .populate("sender", "fullName profileImage");

  if (!notification) {
    throw new apiError(404, "Notification not found");
  }

  if (notification.receiver.toString() !== req.user._id.toString()) {
    throw new apiError(403, "Access denied");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      notification,
      "Notification fetched successfully"
    )
  );
});

const markAsRead = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(401, "Unauthorized request");
  }

  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new apiError(400, "Invalid notification id");
  }

  const notification = await Notification.findById(id);

  if (!notification) {
    throw new apiError(404, "Notification not found");
  }

  if (notification.receiver.toString() !== req.user._id.toString()) {
    throw new apiError(403, "Access denied");
  }

  if (notification.isRead) {
    throw new apiError(400, "Notification already marked as read");
  }

  notification.isRead = true;

  await notification.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      notification,
      "Notification marked as read"
    )
  );
});

// no need to delete iff email
// const deleteNotification = asyncHandler(async (req, res) => {
//   if (!req.user?._id) {
//     throw new apiError(401, "Unauthorized request");
//   }

//   const { id } = req.params;

//   if (!mongoose.isValidObjectId(id)) {
//     throw new apiError(400, "Invalid notification id");
//   }

//   const notification = await Notification.findById(id);

//   if (!notification) {
//     throw new apiError(404, "Notification not found");
//   }

//   if (notification.receiver.toString() !== req.user._id.toString()) {
//     throw new apiError(403, "Access denied");
//   }

//   await Notification.findByIdAndDelete(notification._id);

//   return res.status(200).json(
//     new ApiResponse(
//       200,
//       null,
//       "Notification deleted successfully"
//     )
//   );
// });

export {
  getMyNotifications,
  getNotificationById,
  markAsRead,
//   deleteNotification,
};