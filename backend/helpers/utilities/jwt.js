const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_REFRESH_SECRET } = require("../env");

function generateAccessToken(payload, options = { expiresIn: "1h" }) {
  return jwt.sign(payload, JWT_SECRET, options);
}
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function generateRefreshToken(payload, options = { expiresIn: "7d" }) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, options);
}
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

function generateTokens(payload) {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  return { accessToken, refreshToken };
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTokens,
};
