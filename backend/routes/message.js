const router = require("express").Router();
const messageController = require("@controllers/message");
const validate = require("@middlewares/validate");
const {
  getMessagesSchema,
  paramsWithId,
  addReactionSchema,
  removeReactionSchema,
  updateSchema,
  addMessageSchema,
  addVoiceSchema,
} = require("@schemas/message.schema");
const upload = require("@middlewares/upload");

router.get("/:chatId", validate(getMessagesSchema), messageController.messages);
router.post(
  "/:id/reaction",
  validate(addReactionSchema),
  messageController.addReaction,
);
router.post(
  "/:chatId",
  validate(addMessageSchema),
  messageController.addMessage,
);
router.post(
  "/:chatId/voice",
  upload.single("voice"),
  validate(addVoiceSchema),
  messageController.addVoice,
);
router.patch("/:id", validate(updateSchema), messageController.editMessage);
router.delete("/:id", validate(paramsWithId), messageController.remove);
router.delete(
  "/:id/reaction",
  validate(removeReactionSchema),
  messageController.removeReaction,
);

module.exports = router;
