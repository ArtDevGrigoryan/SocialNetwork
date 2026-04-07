const router = require("express").Router();
const settingController = require("@controllers/setting");
const validate = require("@middlewares/validate");
const isAuth = require("@middlewares/is-auth");
const { notificationSchema } = require("@schemas/setting.schema");

router.patch(
  "/privacy/profile-visibility",
  isAuth,
  settingController.profileVisibilty,
);
router.patch("/privacy/show-typing", isAuth, settingController.showTyping);
router.patch(
  "/notifications",
  isAuth,
  validate([{ body: notificationSchema }]),
  settingController.notification,
);

module.exports = router;
