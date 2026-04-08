const { z } = require("zod");
const { idSchema, paginationSchema } = require("./common.schema");

const postLikesSchema = z.object({
  postId: idSchema,
});

const searchSchema = z.object({
  text: z.string().nonempty(),
});
const paramsWithId = z.object({
  id: idSchema,
});

module.exports = {
  postLikesSchema: [
    { params: postLikesSchema, query: paginationSchema },
    { defaults: true },
  ],
  myLikesSchema: [{ query: paginationSchema }, { defaults: true }],
  searchSchema: [{ query: searchSchema, params: paramsWithId }],
};
