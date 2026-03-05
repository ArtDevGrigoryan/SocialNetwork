const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

function hash(password, SALT = SALT_ROUNDS) {
  return bcrypt.hash(password, SALT);
}

function compare(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  hash,
  compare,
};
