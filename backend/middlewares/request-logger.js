const logger = require("@utilities/logger.js");
const env = require("@helpers/env.js");

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  const { method, originalUrl, body } = req;

  if (env.NODE_ENV === "development") {
    const bodyStr = Object.keys(body || {}).length
      ? ` ${JSON.stringify(body)}`
      : "";
    logger.info(`--> ${method} ${originalUrl}${bodyStr}`);
  } else {
    logger.info(`--> ${method} ${originalUrl}`);
  }

  res.locals.logger = (config) => {
    logger.info(
      `==> ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    );
  };

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    const statusText = res.statusMessage || "OK";

    logger.info(
      `<-- ${method} ${originalUrl} ${statusCode} ${statusText} (${duration}ms)`,
    );
  });

  next();
};

module.exports = requestLogger;
