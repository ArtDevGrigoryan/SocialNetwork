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
  musicUrl: z.string().nonempty(),
});

module.exports = {
  getStorySchema: [{ params: getStorySchema }],
  getFeedSchema: [{ query: getFeedStories }, { defaults: true }],
  addStorySchema: [{ body: addSchema }],
  updateSchema: [{ body: updateSchema, params: getStorySchema }],
};
