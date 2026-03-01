const apiRouter = require("express").Router();
const authRouter = require("./auth");

apiRouter.use("/auth", authRouter);

module.exports = apiRouter;
