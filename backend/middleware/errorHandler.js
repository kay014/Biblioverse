const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`, {
      message: err.message,
      stack: err.stack,
    });
  } else {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`, {
      message: err.message,
    });
  }

  if (statusCode >= 500) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Request failed",
  });
};

module.exports = {
  errorHandler,
};
