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

module.exports.myNotifsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(20).default(20),
});

module.exports.createGroupSchema = z.object({
  userIds: z.array(idSchema),
  groupName: z.string().nonempty().default("Friend group"),
});
