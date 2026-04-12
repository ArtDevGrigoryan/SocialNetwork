const router = require("express").Router();
const storyController = require("@controllers/story");
const upload = require("@middlewares/upload");
const validate = require("@middlewares/validate");
const {
  getStorySchema,
  getFeedSchema,
  addStorySchema,
} = require("@schemas/story.schema");

router.get("/", validate(getFeedSchema), storyController.stories);
router.get("/:id", validate(getStorySchema), storyController.uniqueStory);
router.get(
  "/user/:id",
  validate(getStorySchema),
  storyController.profileStories,
);
router.post(
  "/",
  upload.single("story"),
  validate(addStorySchema),
  storyController.add,
);
router.delete("/:id", validate(getStorySchema), storyController.remove);

module.exports = router;
