import { apiError } from "../utils/apiError.js";

const validate = (validator) => {
  return (req, res, next) => {
    const errors = validator(req);

    if (errors.length > 0) {
      throw new apiError(400, "Validation failed", errors);
    }

    next();
  };
};

export { validate };