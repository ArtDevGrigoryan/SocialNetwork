const { z } = require("zod");
const { idSchema } = require("./common.schema");

const getMessagesSchema = z.object({
  cursor: z.string().nonempty().optional(),
  limit: z.coerce.number().int().min(1).max(40).default(20),
});

const paramsWithId = z.object({
  id: idSchema,
});

const addReactionSchema = z.object({
  participantId: idSchema,
  reaction: z.string().nonempty(),
});

const removeReactionSchema = z.object({
  participantId: idSchema,
});

const updateSchema = z.object({
  text: z.string().nonempty(),
});

const addMessage = z.object({
  text: z.string().nonempty(),
  participantId: idSchema,
});

const addVoiceSchema = z.object({
  participantId: idSchema,
});

const getMessageParams = z.object({
  chatId: idSchema,
});

module.exports = {
  getMessagesSchema: [
    { query: getMessagesSchema, params: getMessageParams },
    { defaults: true },
  ],
  paramsWithId: [{ params: paramsWithId }],
  addReactionSchema: [{ body: addReactionSchema, params: paramsWithId }],
  removeReactionSchema: [{ body: removeReactionSchema, params: paramsWithId }],
  updateSchema: [{ body: updateSchema, params: paramsWithId }],
  addMessageSchema: [{ body: addMessage, params: getMessageParams }],
  addVoiceSchema: [{ body: addVoiceSchema, params: getMessageParams }],
};
