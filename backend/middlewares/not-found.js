const { sendError } = require("@helpers/api-response");

module.exports = function notFoundHandler(req, res, next) {
  sendError(res, "Not Found", 404);
};
