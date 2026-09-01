import mongoose from "mongoose";

const isNonEmptyString = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

const isValidEmail = (value) => {
  if (typeof value !== "string") return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

const isValidObjectId = (value) => {
  return mongoose.isValidObjectId(value);
};

const isPositiveNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) && number > 0;
};

const isValidEnum = (value, allowedValues) => {
  return allowedValues.includes(value);
};

const hasAtLeastOneField = (object, fields) => {
  return fields.some((field) => object[field] !== undefined);
};

export {
  isNonEmptyString,
  isValidEmail,
  isValidObjectId,
  isPositiveNumber,
  isValidEnum,
  hasAtLeastOneField 
};