const { z } = require("zod");
const { idSchema } = require("./common.schema");

const createHighlightSchema = z.object({
  title: z
    .string()
    .max(15, "Title is too long")
    .optional()
    .default("Highlights"),
  cover: z.string().url("Cover must be a valid URL"),
  archives: z.array(idSchema).min(1, "Select at least one story"),
});

const updateHighlightSchema = z.object({
  title: z.string().max(15, "Title is too long").optional(),
  cover: z.string().url("Cover must be a valid URL").optional(),
  archives: z.array(idSchema).optional(),
});

const paramsWithId = z.object({
  id: idSchema,
});

const paramsWithUserId = z.object({
  userId: idSchema,
});

module.exports = {
  createHighlight: [{ body: createHighlightSchema }],
  updateHighlight: [{ body: updateHighlightSchema, params: paramsWithId }],
  getHighlight: [{ params: paramsWithId }],
  getUserHighlights: [{ params: paramsWithUserId }],
};
