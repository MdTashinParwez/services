import {
  isNonEmptyString,
  isValidObjectId,
  hasAtLeastOneField,
} from "../utils/validation.js";

const validateCreateProvider = (req) => {
  const {
    businessName,
    businessDescription,
    businessCategory,
  } = req.body;

  const errors = [];

  if (!isNonEmptyString(businessName)) {
    errors.push("Business name is required");
  }

  if (!isNonEmptyString(businessDescription)) {
    errors.push("Business description is required");
  }

  if (!businessCategory) {
    errors.push("Business category is required");
  } else if (!isValidObjectId(businessCategory)) {
    errors.push("Invalid business category");
  }

  return errors;
};

const validateUpdateProviderDetail = (req) => {
  const allowedFields = [
    "businessName",
    "businessDescription",
    "businessCategory",
  ];

  const errors = [];
  const providedFields = Object.keys(req.body);

  if (!hasAtLeastOneField(req.body, allowedFields)) {
    errors.push("At least one field is required");
    return errors;
  }

  // Reject unknown fields
  const unknownFields = providedFields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length > 0) {
    errors.push(`Unknown fields: ${unknownFields.join(", ")}`);
  }

  // Validate only fields that were provided
  if (
    req.body.businessName !== undefined &&
    !isNonEmptyString(req.body.businessName)
  ) {
    errors.push("Business name cannot be empty");
  }

  if (
    req.body.businessDescription !== undefined &&
    !isNonEmptyString(req.body.businessDescription)
  ) {
    errors.push("Business description cannot be empty");
  }

  if (req.body.businessCategory !== undefined) {
    if (!isValidObjectId(req.body.businessCategory)) {
      errors.push("Invalid business category");
    }
  }

  return errors;
};

export {
  validateCreateProvider,
  validateUpdateProviderDetail,
};