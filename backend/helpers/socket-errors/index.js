class SocketException extends Error {
  constructor(
    event = "error_event",
    err = null,
    message = "something went wrong",
    code = 500,
  ) {
    super(message);
    this.event = event;
    this.err = err;
    this.statusCode = code;
  }
}

class SocketNotFoundException extends SocketException {
  constructor(err, message) {
    super("error_event", err, message, 404);
  }
}

class SocketValidationException extends SocketException {
  constructor(err, message) {
    super("error_event", err, message, 422);
  }
}
class SocketConflictException extends SocketException {
  constructor(err, message) {
    super("error_event", err, message, 409);
  }
}
class SocketUnauthorizedException extends SocketException {
  constructor(err, message) {
    super("error_event", err, message, 401);
  }
}

class SocketBadRequestException extends SocketException {
  constructor(err, message = "Bad request") {
    super("error_event", err, message);
  }
}

module.exports = {
  SocketException,
  SocketNotFoundException,
  SocketValidationException,
  SocketConflictException,
  SocketUnauthorizedException,
  SocketBadRequestException,
};
