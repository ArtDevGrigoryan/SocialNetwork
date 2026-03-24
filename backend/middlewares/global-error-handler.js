const { sendError } = require("@helpers/api-response");
const { ZodError } = require("zod");
const mongoose = require("mongoose");
const { HTTPException } = require("@helpers/errors");

module.exports = function globalErrorHandler(err, req, res, next) {
  console.log("🔥 GLOBAL ERROR:\n");
  console.dir(err, { depth: Infinity, colors: true });

  let statusCode = 500;
  let message = "Internal Server Error";
  let errors = null;

  if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.isAxiosError) {
    statusCode = err.response?.status || 500;
    message =
      err.response?.data?.message || err.message || "External service error";
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Database validation failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired";
  } else if (err instanceof HTTPException) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  return sendError(res, message, statusCode, errors);
};
