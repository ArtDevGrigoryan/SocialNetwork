const logger = require("@utilities/logger");

const createLoggerMiddleware = async (socket, data, next) => {
  logger.info(
    `Socket.io --> { socketId: ${socket.id}, event: ${socket.eventName}, data: ${data} }`,
  );
  try {
    await next();
  } catch (err) {
    logger.error({ socketId: socket.id, err });
    throw err;
  }
};

module.exports = createLoggerMiddleware;
