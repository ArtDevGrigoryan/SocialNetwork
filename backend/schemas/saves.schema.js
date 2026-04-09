const { z } = require("zod");
const { idSchema, paginationSchema } = require("./common.schema");

const addSaveSchema = z.object({
  postId: idSchema,
});

module.exports = {
  addSaveSchema: [{ params: addSaveSchema }],
  getSavesSchema: [{ query: paginationSchema }, { defaults: true }],
};
