const AppError = require("../utils/AppError");

function handleCastError(err) {
  return new AppError(`Invalid value for ${err.path}: ${err.value}`, 400);
}

function handleDuplicateFieldError(err) {
  const field = Object.keys(err.keyValue || {})[0] || "field";
  return new AppError(`Duplicate value for ${field}. Please use another value.`, 400);
}

function handleValidationError(err) {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Invalid input: ${messages.join(". ")}`, 400);
}

function handleJWTError() {
  return new AppError("Invalid session. Please log in again.", 401);
}

function handleJWTExpired() {
  return new AppError("Your session has expired. Please log in again.", 401);
}

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  let error = { ...err, message: err.message };

  if (err.name === "CastError") error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateFieldError(err);
  if (err.name === "ValidationError") error = handleValidationError(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpired();

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational;

  if (process.env.NODE_ENV === "development") {
    console.error(err);
  } else if (!isOperational) {
    // Unexpected/programming error in production — log but don't leak details
    console.error("UNEXPECTED ERROR 💥", err);
  }

  res.status(statusCode).json({
    status: error.status || "error",
    message: isOperational ? error.message : "Something went wrong. Please try again.",
  });
};
