const { z } = require("zod");
const { idSchema } = require("./common.schema");

module.exports.joinRoomSchema = z.object({
  chatId: idSchema,
});

module.exports.followSchema = z.object({
  userId: idSchema,
});

module.exports.markReadSchema = z.object({
  notificationId: idSchema,
});

module.exports.startDMSchema = z.object({
  userId: idSchema,
});

module.exports.messageSchema = z.object({
  message: z.string().nonempty(),
  chatId: idSchema,
});

module.exports.createChatSchema = z.object({
  userIds: z.array(idSchema),
});

module.exports.searchSchema = z.object({
  text: z.string().nonempty(),
});
