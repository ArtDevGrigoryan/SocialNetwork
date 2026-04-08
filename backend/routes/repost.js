const router = require("express").Router();
const repostController = require("@controllers/repost");
const validate = require("@middlewares/validate");
const {
  getSpecificSchema,
  getArchivedSchema,
} = require("@schemas/post.schema");

router.post("/:id", validate(getSpecificSchema), repostController.toggleRepost);
router.get("/my", validate(getArchivedSchema), repostController.myReposts);
router.get("/", validate(getArchivedSchema), repostController.myPostsReposts);

module.exports = router;
