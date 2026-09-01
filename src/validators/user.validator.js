import {
  isNonEmptyString,
  isValidEmail,
  hasAtLeastOneField,
} from "../utils/validation.js";

const validateRegisterUser = (req) => {
  const { username, email, password, phone } = req.body;

  const errors = [];

  if (!isNonEmptyString(username)) {
    errors.push("Username is required");
  }

  if (!isValidEmail(email)) {
    errors.push("Valid email is required");
  }

  if (!isNonEmptyString(password)) {
    errors.push("Password is required");
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (!isNonEmptyString(phone)) {
    errors.push("Phone is required");
  }

  return errors;
};

const validateLoginUser = (req) => {
  const { email, phone, password } = req.body;

  const errors = [];

  if (!isNonEmptyString(email) && !isNonEmptyString(phone)) {
    errors.push("Email or phone is required");
  }

  if (!isNonEmptyString(password)) {
    errors.push("Password is required");
  }

  if (email !== undefined && !isValidEmail(email)) {
    errors.push("Invalid email format");
  }

  return errors;
};

const validateChangePassword = (req) => {
  const { oldPassword, newPassword } = req.body;

  const errors = [];

  if (!isNonEmptyString(oldPassword)) {
    errors.push("Old password is required");
  }

  if (!isNonEmptyString(newPassword)) {
    errors.push("New password is required");
  } else if (newPassword.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (
    isNonEmptyString(oldPassword) &&
    isNonEmptyString(newPassword) &&
    oldPassword === newPassword
  ) {
    errors.push("New password cannot be same as old password");
  }

  return errors;
};

const validateUpdateProfile = (req) => {
  const allowedFields = ["username", "email", "phone"];
  const errors = [];

  const providedFields = Object.keys(req.body);

  if (!hasAtLeastOneField(req.body, allowedFields)) {
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
    req.body.username !== undefined &&
    !isNonEmptyString(req.body.username)
  ) {
    errors.push("Username cannot be empty");
  }

  if (
    req.body.email !== undefined &&
    !isValidEmail(req.body.email)
  ) {
    errors.push("Invalid email format");
  }

  if (
    req.body.phone !== undefined &&
    !isNonEmptyString(req.body.phone)
  ) {
    errors.push("Phone cannot be empty");
  }

  return errors;
};

export {
  validateRegisterUser,
  validateLoginUser,
  validateChangePassword,
  validateUpdateProfile,
};