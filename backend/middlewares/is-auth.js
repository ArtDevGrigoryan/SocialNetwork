const { UnauthorizedException } = require("@helpers/errors");
const { verifyAccessToken } = require("@utilities/jwt");
const User = require("@models/user");

async function isAuth(req, _, next) {
  const token = req.headers.authorization?.split(" ")[1];
  const payload = verifyAccessToken(token);

  if (payload) {
    const user = await User.findById(payload.id);
    req.user = user;
    return next();
  }
  throw new UnauthorizedException("Authentication required");
}

module.exports = isAuth;
