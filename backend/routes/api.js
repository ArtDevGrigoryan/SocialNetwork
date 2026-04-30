const isAuth = require("@middlewares/is-auth");
const router = require("express").Router();

const authRouter = require("@routes/auth");
const friendRouter = require("@routes/friend");
const settingRouter = require("@routes/setting");
const saveRouter = require("@routes/save");
const commentRouter = require("@routes/comment");
const postRouter = require("@routes/post");
const repostRouter = require("@routes/repost");
const likeRouter = require("@routes/like");
const chatRouter = require("@routes/chat");
const messageRouter = require("@routes/message");
const storyRouter = require("@routes/story");
const archiveRouter = require("@routes/archive");
const userRouter = require("@routes/user");
const notificationsRouter = require("@routes/notifications");
const exploreRouter = require("@routes/explore");
const highlightRouter = require("@routes/highlight");

const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const swaggerDocument = YAML.load("./docs/swagger.yaml");

router.use("/auth", authRouter);
router.use("/friends", isAuth, friendRouter);
router.use("/settings", isAuth, settingRouter);
router.use("/saves", isAuth, saveRouter);
router.use("/comments", isAuth, commentRouter);
router.use("/posts", isAuth, postRouter);
router.use("/reposts", isAuth, repostRouter);
router.use("/likes", isAuth, likeRouter);
router.use("/chats", isAuth, chatRouter);
router.use("/messages", isAuth, messageRouter);
router.use("/stories", isAuth, storyRouter);
router.use("/archives", isAuth, archiveRouter);
router.use("/users", isAuth, userRouter);
router.use("/notifications", isAuth, notificationsRouter);
router.use("/explore", isAuth, exploreRouter);
router.use("/highlights", isAuth, highlightRouter);
router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

console.log("API DOCS SWAGGER-UI \nhttp://localhost:8888/api/docs");

module.exports = router;
