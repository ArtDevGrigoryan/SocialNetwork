const { z } = require("zod");
const { idSchema } = require("./common.schema");

const getStorySchema = z.object({
  id: idSchema,
});
const updateSchema = z.object({
  reaction: z.string().nonempty(),
});
const getFeedStories = z.object({
  limit: z.coerce.number().int().min(10).max(50).default(20),
  cursor: z.string().nonempty().optional(),
});

const addSchema = z.object({
  type: z.enum(["image", "video"]),
  mentions: z.string().optional(),
  musicUrl: z.string().optional(),
  musicTitle: z.string().optional(),
  musicCover: z.string().optional(),
  musicStartTime: z.coerce.number().optional(),
  musicDuration: z.coerce.number().optional(),
  isVideoMuted: z.string().optional(),
  musicWidget: z.string().optional(),
  filter: z.string().optional(),
  location: z.string().optional(),
  linkSticker: z.string().optional(),
  transform: z.string().optional(),
  stickers: z.string().optional(),
  texts: z.string().optional(),
});

module.exports = {
  getStorySchema: [{ params: getStorySchema }],
  getFeedSchema: [{ query: getFeedStories }, { defaults: true }],
  addStorySchema: [{ body: addSchema }],
  updateSchema: [{ body: updateSchema, params: getStorySchema }],
};
