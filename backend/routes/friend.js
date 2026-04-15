const router = require("express").Router();
const friendController = require("@controllers/friend");
const isAuth = require("@middlewares/is-auth");
const validate = require("@middlewares/validate");
const { getSchema, requestSchema, blockSchema, followSchema, requestsSchema } = require("@schemas/friend.schema");

router.get("/followers/:id", isAuth, validate(getSchema), friendController.getFollowers);
router.get("/followings/:id", isAuth, validate(getSchema), friendController.getFollowings);
router.get("/search", isAuth, friendController.search);
router.get("/requests", isAuth, validate(requestsSchema), friendController.requests);
router.get("/blocks", isAuth, validate(getSchema), friendController.getBlockeds)
router.post("/follow/:id", isAuth, validate(followSchema), friendController.follow);
router.post("/unfollow/:id", isAuth, validate(followSchema), friendController.unfollow);
router.patch("/accept", isAuth, validate(requestSchema), friendController.accept);
router.patch("/cancel", isAuth, validate(requestSchema), friendController.cancel);
router.patch("/decline", isAuth, validate(requestSchema), friendController.decline);
router.post("/block/:userId", isAuth, validate(blockSchema), friendController.toggleBlock);


module.exports = router;
