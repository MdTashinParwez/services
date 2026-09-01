import {
  isNonEmptyString,
  isValidObjectId,
  hasAtLeastOneField,
} from "../utils/validation.js";

const allowedServiceTypes = ["online", "onsite", "hybrid"];

const validateCreateService = (req) => {
  const body = req.body || {};

  const {
    title,
    description,
    category,
    price,
    duration,
    serviceType,
    location,
  } = body;

  const errors = [];

  if (!isNonEmptyString(title)) {
    errors.push("Title is required");
  }

  if (!isNonEmptyString(description)) {
    errors.push("Description is required");
  }

  if (!category) {
    errors.push("Category is required");
  } else if (!isValidObjectId(category)) {
    errors.push("Invalid category id");
  }

  if (price === undefined || price === null || price === "") {
    errors.push("Price is required");
  } else if (
    !Number.isFinite(Number(price)) ||
    Number(price) <= 0
  ) {
    errors.push("Price must be greater than 0");
  }

  if (duration === undefined || duration === null || duration === "") {
    errors.push("Duration is required");
  } else if (
    !Number.isFinite(Number(duration)) ||
    Number(duration) <= 0
  ) {
    errors.push("Duration must be greater than 0");
  }

  if (!serviceType) {
    errors.push("Service type is required");
  } else if (!allowedServiceTypes.includes(serviceType)) {
    errors.push("Invalid service type");
  }

  if (
    (serviceType === "onsite" || serviceType === "hybrid") &&
    !isNonEmptyString(location)
  ) {
    errors.push("Location is required for onsite and hybrid services");
  }

  return errors;
};

const validateUpdateService = (req) => {
  const allowedFields = [
    "title",
    "description",
    "category",
    "price",
    "duration",
    "location",
    "serviceType",
    "tags",
    "customFields",
  ];

  const errors = [];
  const body = req.body || {};

  const providedFields = Object.keys(body);

  if (!hasAtLeastOneField(body, allowedFields)) {
    errors.push("At least one field is required");
    return errors;
  }

  const unknownFields = providedFields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length > 0) {
    errors.push(`Unknown fields: ${unknownFields.join(", ")}`);
  }

  if (
    body.title !== undefined &&
    !isNonEmptyString(body.title)
  ) {
    errors.push("Title cannot be empty");
  }

  if (
    body.description !== undefined &&
    !isNonEmptyString(body.description)
  ) {
    errors.push("Description cannot be empty");
  }

  if (
    body.category !== undefined &&
    !isValidObjectId(body.category)
  ) {
    errors.push("Invalid category id");
  }

  if (body.price !== undefined) {
    if (
      body.price === "" ||
      !Number.isFinite(Number(body.price)) ||
      Number(body.price) <= 0
    ) {
      errors.push("Price must be greater than 0");
    }
  }

  if (body.duration !== undefined) {
    if (
      body.duration === "" ||
      !Number.isFinite(Number(body.duration)) ||
      Number(body.duration) <= 0
    ) {
      errors.push("Duration must be greater than 0");
    }
  }

  if (body.serviceType !== undefined) {
    if (!allowedServiceTypes.includes(body.serviceType)) {
      errors.push("Invalid service type");
    }
  }

  if (
    body.tags !== undefined &&
    !Array.isArray(body.tags)
  ) {
    errors.push("Tags must be an array");
  }

  return errors;
};

export {
  validateCreateService,
  validateUpdateService,
};