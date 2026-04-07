const dotenv = require("dotenv");
const envVariableValidation = require("../helpers/utilities/validate-env-variables");
const path = require("path");

const envPath = path.resolve("./.env");
dotenv.config({ path: envPath });

module.exports = envVariableValidation(process.env);