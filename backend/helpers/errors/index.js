class HTTPException extends Error {
  constructor(code = 500, message = "Somethig went wrong") {
    super(message);
    this.statusCode = code;
  }
}

class BadRequestException extends HTTPException {
  constructor(message) {
    super(400, message);
    this.name = "BadRequestException";
  }
}

class NotFoundException extends HTTPException {
  constructor(message) {
    super(404, message);
    this.name = "NotFoundException";
  }
}

class ForBiddenException extends HTTPException {
  constructor(message) {
    super(403, message);
    this.name = "ForBiddenException";
  }
}

class ConflictException extends HTTPException {
  constructor(message = "Conflict") {
    super(409, message);
    this.name = "ConflictException";
    this.statusCode = 409;
  }
}

class UnauthorizedException extends HTTPException {
  constructor(message = "Unauthorized") {
    super(401, message);
    this.name = "UnauthorizedException";
    this.statusCode = 401;
  }
}

module.exports = {
  HTTPException,
  NotFoundException,
  ForBiddenException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
};
