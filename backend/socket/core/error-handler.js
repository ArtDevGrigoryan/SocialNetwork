const { SocketException } = require("@helpers/socket-errors/");
const { ZodError } = require("zod");

function errorHandler(socket, err) {
  console.error("SOCKET ERROR:", err);

  if (err instanceof SocketException) {
    return socket.emit(err.event, {
      message: err.message,
      status: err.status,
    });
  } else if (err instanceof ZodError) {
    return socket.emit("error_event", {
      message: err.message,
      status: 422,
    });
  }

  socket.emit("error_event", {
    message: "Internal server error",
    status: 500,
  });
}

module.exports = errorHandler;
