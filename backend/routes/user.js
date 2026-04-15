const router = require("express").Router();
const validate = require("@middlewares/validate");
const { paramsWithId } = require("@schemas/chat.schema");
const userController = require("@controllers/user");

router.get("/:id", validate(paramsWithId), userController.getUser);

module.exports = router;
