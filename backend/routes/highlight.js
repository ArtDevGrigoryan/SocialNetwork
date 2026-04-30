const router = require("express").Router();
const highlightController = require("@controllers/highlight");
const validate = require("@middlewares/validate");
const schemas = require("@schemas/highlight.schema");

router.post("/", validate(schemas.createHighlight), highlightController.create);
router.get(
  "/user/:userId",
  validate(schemas.getUserHighlights),
  highlightController.getUserHighlights,
);
router.get(
  "/:id",
  validate(schemas.getHighlight),
  highlightController.getHighlight,
);
router.delete(
  "/:id",
  validate(schemas.getHighlight),
  highlightController.remove,
);

module.exports = router;
