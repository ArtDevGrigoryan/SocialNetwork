const router = require("express").Router();
const archiveController = require("@controllers/archive");
const validate = require("@middlewares/validate");
const { uniqueSchema, getArchivedSchema } = require("@schemas/archive.schema");

router.get("/", validate(getArchivedSchema), archiveController.archiveds);
router.get("/:id", validate(uniqueSchema), archiveController.findUnique);
router.get("/:id/viewers", validate(uniqueSchema), archiveController.viewers)
router.delete("/:id", validate(uniqueSchema), archiveController.remove);

module.exports = router;
