const { z } = require("zod");
const { idSchema } = require("./common.schema");

const getChatSchema = z.object({
  text: z.string().nonempty().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

const paramsWithId = z.object({
  id: idSchema,
});

const togglePinMsg = z.object({
  participantId: idSchema,
  messageId: idSchema,
});

const updateSchema = z.object({
  groupName: z.string().trim().nonempty().optional(),
});

const dmSchema = z.object({
  userId: idSchema,
});
const groupSchema = z.object({
  userIds: z.array(idSchema),
  groupName: z.string().nonempty().optional(),
  groupAvatar: z.string().nonempty().optional(),
});

const removeMemberSchema = z.object({
  participantId: idSchema,
  removerId: idSchema,
});

const disjoinSchema = z.object({
  participantId: idSchema,
});

module.exports = {
  getChatSchema: [{ query: getChatSchema }, { defaults: true }],
  paramsWithId: [{ params: paramsWithId }],
  togglePinMsg: [{ body: togglePinMsg, params: paramsWithId }],
  updateSchema: [{ body: updateSchema, params: paramsWithId }],
  dmSchema: [{ body: dmSchema }],
  groupSchema: [{ body: groupSchema }],
  removeMemberSchema: [{ body: removeMemberSchema, params: paramsWithId }],
  disjoinSchema: [{ body: disjoinSchema, params: paramsWithId }],
};
