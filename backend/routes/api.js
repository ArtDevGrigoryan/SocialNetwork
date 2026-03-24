const apiRouter = require("express").Router();
const authRouter = require("@routes/auth");

apiRouter.use("/auth", authRouter);

module.exports = apiRouter;
