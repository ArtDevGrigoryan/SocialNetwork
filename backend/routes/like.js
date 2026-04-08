const router = require("express").Router();
const likeController = require("@controllers/like");
const validate = require("@middlewares/validate");
const schemas = require("@schemas/like.schema");

router.get(
  "/:postId",
  validate(schemas.postLikesSchema),
  likeController.postLikes,
);
router.get("/", validate(schemas.myLikesSchema), likeController.myLikes);
router.get("/search", validate(schemas.searchSchema), likeController.search);

module.exports = router;
