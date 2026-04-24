import { ApiError } from "../utils/ApiError.js";

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

export const errorHandler = (error, req, res, next) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      details: error.details,
    });
  }

  if (error.name === "ValidationError") {
    console.warn("ValidationError:", error.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      details: error.message,
    });
  }

  if (error?.code === 11000) {
    console.warn("Duplicate key:", error.keyValue);
    return res.status(409).json({
      success: false,
      message: "Duplicate value already exists",
      details: error.keyValue || null,
    });
  }

  console.error(
    "Unhandled error:",
    req.method,
    req.originalUrl,
    error?.stack || error,
  );

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
