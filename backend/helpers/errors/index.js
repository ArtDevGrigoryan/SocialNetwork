const NotFoundException = require("./not-found");
const ForBiddenException = require("./forbidden");
const ConflictException = require("./conflict");
const UnauthorizedException = require("./unauthorized");
const BadRequestException = require("./bad-request");

module.exports = {
  NotFoundException,
  ForBiddenException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
};
