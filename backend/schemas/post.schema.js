const { z } = require("zod");
const { idSchema, paginationSchema } = require("./common.schema");

const getPostsSchema = z.object({
  author: idSchema,
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
  getPostsSchema: [
    { body: getPostsSchema, query: paginationSchema },
    { defaults: true },
  ],
  getArchivedSchema: [{ query: paginationSchema }, { defaults: true }],
  getSpecificSchema: [{ params: getSpecificSchema }],
  updateSchema: [{ params: getSpecificSchema, body: updateSchema }],
  removeImageSchema: [{ body: removeImageSchema, params: getSpecificSchema }],
  createSchema: [{ body: createSchema }],
};
