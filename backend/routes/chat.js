const router = require("express").Router();
const chatController = require("@controllers/chat");
const validate = require("@middlewares/validate");
const {
  paramsWithId,
  getChatSchema,
  togglePinMsg,
  updateSchema,
  dmSchema,
  groupSchema,
  removeMemberSchema,
  disjoinSchema,
} = require("@schemas/chat.schema");

router.get("/", validate(getChatSchema), chatController.chats);
router.get("/my", chatController.myChats);
router.get("/key", chatController.getByKey);
router.get("/:id/admins", validate(paramsWithId), chatController.admins);
router.get("/:id", validate(paramsWithId), chatController.specificChat);
router.patch(
  "/:id/message",
  validate(togglePinMsg),
  chatController.togglePinMsg,
);
router.patch("/:id", validate(updateSchema), chatController.update);
router.patch("/read/:id", validate(paramsWithId), chatController.readMsg);
router.post("/dm", validate(dmSchema), chatController.createDM);
router.post("/group", validate(groupSchema), chatController.createGroup);
router.post(
  "/:id/participant",
  validate(paramsWithId),
  chatController.addMembers,
);
router.patch(
  "/:id/participant/:participantId",
  // validate(updateSchema),
  chatController.updateParticipant,
);
router.delete("/:id", validate(paramsWithId), chatController.removeGroup);
router.delete(
  "/:id/participant",
  validate(removeMemberSchema),
  chatController.removeMember,
);
router.delete("/:id/disjoin", validate(disjoinSchema), chatController.disjoin);

module.exports = router;
