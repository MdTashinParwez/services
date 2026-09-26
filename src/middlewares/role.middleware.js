import { apiError } from "../utils/apiError.js";

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new apiError(401, "Unauthorized request");
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new apiError(
                403,
                "You are not authorized to perform this action"
            );
        }

        next();
    };
};