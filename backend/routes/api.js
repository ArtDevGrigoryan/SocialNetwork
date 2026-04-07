const isAuth = require("@middlewares/is-auth");
const router = require("express").Router();

const authRouter = require("@routes/auth");
const friendRouter = require("@routes/friend");
const settingRouter = require("@routes/setting");
const saveRouter = require("@routes/save");
const commentRouter = require("@routes/comment");
const postRouter = require("@routes/post");
const repostRouter = require("@routes/repost");

router.use("/auth", authRouter);
router.use("/friends", isAuth, friendRouter);
router.use("/settings", isAuth, settingRouter);
router.use("/saves", isAuth, saveRouter);
router.use("/comments", isAuth, commentRouter);
router.use("/posts", isAuth, postRouter);
router.use("/reposts", isAuth, repostRouter);

module.exports = router;
