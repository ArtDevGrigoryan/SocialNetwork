const pino = require("pino");
const path = require("path");
const fs = require("fs");
const env = require("../env.js");

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const isProd = env.NODE_ENV === "production";

function getLogFileName() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${month}-${day}.log`;
}

let pinoLogger;

if (isProd) {
  const logFilePath = path.join(logsDir, getLogFileName());

  pinoLogger = pino(
    { level: "info" },
    pino.transport({
      target: "pino/file",
      options: {
        destination: logFilePath,
        mkdir: true,
      },
    }),
  );
} else {
  pinoLogger = pino({
    level: "debug",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "yyyy-mm-dd HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  });
}

const logger = {
  info(message) {
    pinoLogger.info(message);
  },
  warn(message) {
    pinoLogger.warn(message);
  },
  error(message) {
    pinoLogger.error(message);
  },
};

module.exports = logger;
