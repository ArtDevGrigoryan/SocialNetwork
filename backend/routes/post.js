const router = require("express").Router();
const postController = require("@controllers/post");
const upload = require("@middlewares/upload");
const validate = require("@middlewares/validate");
const schemas = require("@schemas/post.schema");

router.get("/", validate(schemas.getPostsSchema), postController.getPosts);
router.get(
  "/archived",
  validate(schemas.getArchivedSchema),
  postController.getArchived,
);
router.get(
  "/:id",
  validate(schemas.getSpecificSchema),
  postController.getSpecific,
);
router.patch(
  "/:id",
  validate(schemas.updateSchema),
  upload.array("post", 10),
  postController.update,
);
router.patch(
  "/:id/like",
  validate(schemas.getSpecificSchema),
  postController.toggleLike,
);
router.patch(
  "/:id/archive",
  validate(schemas.getSpecificSchema),
  postController.toggleArchive,
);
router.delete(
  "/:id",
  validate(schemas.getSpecificSchema),
  postController.delete,
);
router.delete(
  "/:id/image",
  validate(schemas.removeImageSchema),
  postController.removeImage,
);
router.post(
  "/",
  upload.array("post", 10),
  validate(schemas.createSchema),
  postController.create,
);

module.exports = router;
