const UAParser = require("ua-parser-js");

module.exports = function getUserAgent(req, _, next) {
  // const parser = new UAParser(req.headers["user-agent"]);
  // const result = parser.getResult();
  // req.userAgent = result;
  next();
};
