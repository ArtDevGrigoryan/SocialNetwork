class ForBiddenException extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForBiddenException';
    this.statusCode = 403;
  }
}

module.exports = ForBiddenException;