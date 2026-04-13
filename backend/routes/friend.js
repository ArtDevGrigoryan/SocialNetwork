const router = require("express").Router();
const friendController = require("@controllers/friend");
const isAuth = require("@middlewares/is-auth");
const validate = require("@middlewares/validate");
const { getSchema, requestSchema, blockSchema, followSchema } = require("@schemas/friend.schema");

router.get("/followers", isAuth, validate(getSchema), friendController.getFollowers);
router.get("/followings", isAuth, validate(getSchema), friendController.getFollowings);
router.get("/blocks", isAuth, validate(getSchema), friendController.getBlockeds)
router.post("/follow/:id", isAuth, validate(followSchema), friendController.follow);
router.post("/unfollow/:id", isAuth, validate(followSchema), friendController.unfollow);
router.patch("/accept", isAuth, validate(requestSchema), friendController.accept);
router.patch("/cancel", isAuth, validate(requestSchema), friendController.cancel);
router.patch("/decline", isAuth, validate(requestSchema), friendController.decline);
router.post("/block/:userId", isAuth, validate(blockSchema), friendController.toggleBlock);


module.exports = router;
