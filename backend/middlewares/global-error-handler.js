const { sendError } = require("../helpers/api-response");

module.exports = function globalErrorHandler(err, req, res, next) {
  console.error("🔥 GLOBAL ERROR:", err);

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
  } else if (err instanceof Error) {
    message = err.message;
  }

  return sendError(res, message, statusCode, errors);
};
