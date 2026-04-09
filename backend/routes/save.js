const router = require("express").Router();
const saveController = require("@controllers/save");
const validate = require("@middlewares/validate");
const { getSavesSchema, addSaveSchema } = require("@schemas/saves.schema");

router.get("/", validate(getSavesSchema), saveController.saves);
router.post("/:postId", validate(addSaveSchema), saveController.add);
router.delete("/:postId", validate(addSaveSchema), saveController.delete);

module.exports = router;
