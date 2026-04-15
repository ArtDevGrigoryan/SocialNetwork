const commentController = require("@controllers/comment");
const router = require("express").Router();
const validate = require("@middlewares/validate");
const schemas = require("@schemas/comment.schema");

router.get(
  "/my",
  validate(schemas.myCommentsSchema),
  commentController.myComments,
);
router.get(
  "/:postId",
  validate(schemas.getCommentsSchema),
  commentController.comments,
);
router.patch(
  "/:id",
  validate(schemas.updateCommentSchema),
  commentController.update,
);
router.post(
  "/:postId",
  validate(schemas.addCommentSchema),
  commentController.add,
);
router.delete(
  "/:id",
  validate(schemas.deleteCommentSchema),
  commentController.delete,
);

module.exports = router;
