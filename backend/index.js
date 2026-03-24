require("module-alias/register");
const socketio = require("socket.io");
const express = require("express");
const cors = require("cors");
const corsOrigin = require("@constants/cors-origin");
const env = require("@helpers/env");
const processEventHandler = require("@utilities/process-exit");
const globalErrorHandler = require("@middlewares/global-error-handler");
const notFoundHandler = require("@middlewares/not-found");
const { connect: connectDB } = require("@db/connect");
const cookieParser = require("cookie-parser");
const requestLogger = require("@middlewares/request-logger");
const { createServer } = require("http");
const { initSocket } = require("./socket");
const socketHandlerService = require("@services/socket.handler");

// IIFE to connect to the database before starting the server
(async () => {
  await connectDB();
  socketHandlerService.registerEventHandlers.call(socketHandlerService);
})();

const app = express();
const appServer = createServer(app);

const io = initSocket(appServer);

app.use(cors(corsOrigin));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);

app.use("/api", require("./routes/api"));

const server = appServer.listen(env.PORT, () => {
  console.dir(`Server is running on port ${env.PORT}`, { colors: true });
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

processEventHandler(server, io);
