const router = require("express").Router();
const validate = require("@middlewares/validate");
const { paramsWithId } = require("@schemas/chat.schema");
const userController = require("@controllers/user");

router.get("/config", userController.getConfig);
router.get("/:id", validate(paramsWithId), userController.getUser);

module.exports = router;
