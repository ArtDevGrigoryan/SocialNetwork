const router = require("express").Router();
const friendController = require("@controllers/friend");
const validate = require("@middlewares/validate");
const { getSchema, requestSchema, blockSchema, followSchema, requestsSchema } = require("@schemas/friend.schema");

router.get("/followers/:id",  validate(getSchema), friendController.getFollowers);
router.get("/followings/:id",  validate(getSchema), friendController.getFollowings);
router.get("/suggestions",  friendController.getSuggestions);
router.get("/search",  friendController.search);
router.get("/requests",  validate(requestsSchema), friendController.requests);
router.get("/blocks",  validate(getSchema), friendController.getBlockeds)
router.post("/follow/:id",  validate(followSchema), friendController.follow);
router.post("/unfollow/:id",  validate(followSchema), friendController.unfollow);
router.patch("/accept",  validate(requestSchema), friendController.accept);
router.patch("/cancel",  validate(requestSchema), friendController.cancel);
router.patch("/decline",  validate(requestSchema), friendController.decline);
router.post("/block/:userId",  validate(blockSchema), friendController.toggleBlock);


module.exports = router;
