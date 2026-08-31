const errorHandler = (err, req, res, next) => {
    const isProduction = process.env.NODE_ENV === "production";

    console.error("ERROR:", {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
    });

    // Mongoose Validation Error
    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map((error) => ({
            field: error.path,
            message: error.message,
        }));

        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: "Validation failed",
            errors,
        });
    }
// Mongoose Cast Error
    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: `Invalid ${err.path}`,
            errors: [],
        });
    }
// MongoDB Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0];

        return res.status(409).json({
            success: false,
            statusCode: 409,
            message: field
                ? `${field} already exists`
                : "Duplicate resource",
            errors: [],
        });
    }
// JWT Errors
    if (
        err.name === "JsonWebTokenError" ||
        err.name === "TokenExpiredError"
    ) {
        return res.status(401).json({
            success: false,
            statusCode: 401,
            message: "Invalid or expired access token",
            errors: [],
        });
    }
// Custom ApiError
    if (err.name === "apiError") {
        return res.status(err.statusCode).json({
            success: false,
            statusCode: err.statusCode,
            message: err.message,
            errors: err.errors || [],
        });
    }
 // Unknown / Internal Server Error
    return res.status(500).json({
        success: false,
        statusCode: 500,
        message: isProduction
            ? "Internal Server Error"
            : err.message || "Internal Server Error",
        errors: isProduction
            ? []
            : err.errors || [],
    });
};

export { errorHandler };