const { z } = require("zod");
const { idSchema, paginationSchema } = require("./common.schema");

const getPostsSchema = z.object({
  author: idSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(20),
});

const getSpecificSchema = z.object({
  id: idSchema,
});

const updateSchema = z
  .object({
    content: z.string().nonempty().optional(),
  })
  .optional();

const removeImageSchema = z.object({
  url: z.string().nonempty(),
});

const createSchema = z.object({
  content: z.string().nonempty(),
});

module.exports = {
  getPostsSchema: [{ query: getPostsSchema }, { defaults: true }],
  getArchivedSchema: [{ query: paginationSchema }, { defaults: true }],
  getSpecificSchema: [{ params: getSpecificSchema }],
  updateSchema: [{ params: getSpecificSchema, body: updateSchema }],
  removeImageSchema: [{ body: removeImageSchema, params: getSpecificSchema }],
  createSchema: [{ body: createSchema }],
};
