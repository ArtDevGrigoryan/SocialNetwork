const dotenv = require("dotenv");
const path = require("path");
const validateEnv = require("./utilities/validate-env-variables");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

module.exports = validateEnv(process.env);
