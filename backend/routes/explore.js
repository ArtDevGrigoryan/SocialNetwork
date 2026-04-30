const router = require("express").Router();
const exploreController = require("@controllers/explore");
const validate = require("@middlewares/validate");
const { postsSchema } = require("@schemas/explore.schema");

router.get("/posts", validate(postsSchema), exploreController.posts);

module.exports = router;
