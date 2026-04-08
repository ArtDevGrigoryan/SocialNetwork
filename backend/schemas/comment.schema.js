const { z } = require("zod");
const { idSchema, paginationSchema } = require("./common.schema");

const addCommentSchema = z.object({
  text: z.string().nonempty(),
});

const paramsWithPostId = z.object({
  postId: idSchema,
});

const paramsWithCommentId = z.object({
  id: idSchema,
});

module.exports = {
  addCommentSchema: [{ body: addCommentSchema, params: paramsWithPostId }],
  updateCommentSchema: [
    { body: addCommentSchema, params: paramsWithCommentId },
  ],
  deleteCommentSchema: [{ params: paramsWithCommentId }],
  getCommentsSchema: [
    { params: paramsWithPostId, query: paginationSchema },
    { defaults: true },
  ],
  myCommentsSchema: [{ query: paginationSchema }, { defaults: true }],
};
