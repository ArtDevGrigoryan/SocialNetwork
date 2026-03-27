const compose = require("./compose");
const errorHandler = require("./error-handler");

module.exports = function event(...middlewares) {
  const pipeline = compose(...middlewares);

  return async (socket, data) => {
    try {
      return await pipeline(socket, data);
    } catch (err) {
      errorHandler(socket, err);
    }
  };
};
