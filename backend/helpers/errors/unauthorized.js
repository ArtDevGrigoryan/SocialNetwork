class UnauthorizedException extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedException";
    this.statusCode = 401;
  }
}

module.exports = UnauthorizedException;