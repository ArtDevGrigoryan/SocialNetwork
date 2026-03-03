const socketio = require("socket.io");
const express = require("express");
const cors = require("cors");
const env = require("./helpers/env");
const processEventHandler = require("./helpers/utilities/process-exit");
const globalErrorHandler = require("./middlewares/global-error-handler");
const notFoundHandler = require("./middlewares/not-found");
const { connect: connectDB } = require("./helpers/db/connect");
const cookieParser = require("cookie-parser");

// IIFE to connect to the database before starting the server
(async () => {
  await connectDB();
})();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", require("./routes/api"));

const server = app.listen(env.PORT, () => {
  console.dir(`Server is running on port ${env.PORT}`, { colors: true });
});

const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.use(notFoundHandler);
app.use(globalErrorHandler);

processEventHandler(server, io);
