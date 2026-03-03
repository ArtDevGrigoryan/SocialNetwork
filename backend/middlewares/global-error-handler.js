const { sendError } = require("../helpers/api-response");

module.exports = function globalErrorHandler(err, req, res, next) {
  console.log("GLOBAL ERROR HANDLER!!!!\n", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return sendError(res, message, statusCode);
};
