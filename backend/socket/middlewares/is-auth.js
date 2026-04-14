const { SocketUnauthorizedException } = require("@helpers/socket-errors");
const { verifyAccessToken } = require("@helpers/utilities/jwt");
const User = require("@models/user");

module.exports = async function isAuth(socket, data, next) {
  const token = socket.handshake.auth.token;
  if (!token) {
    throw new SocketUnauthorizedException(null, "Unauthorized");
  }
  try {
    const payload = verifyAccessToken(token);
    if (!payload) {
      throw new SocketUnauthorizedException(null, "Unauthorized");
    }
    socket.user = await User.findById(payload.id);
  } catch (err) {
    throw new SocketUnauthorizedException(null, "Unauthorized");
  }
  return next();
};
