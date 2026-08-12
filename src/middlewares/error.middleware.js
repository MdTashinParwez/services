const errorHandler = (err, req, res, next) => {

  console.error("ERROR:", err);   // dev

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || "Internal Server Error",
    error: err.error || [],
  });
};

export { errorHandler };