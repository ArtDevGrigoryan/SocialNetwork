const { z } = require("zod");
const { paginationSchema } = require("./common.schema");

const exploreQuerySchema = paginationSchema.extend({
  tag: z.string().optional(),
});

module.exports = {
  postsSchema: [{ query: exploreQuerySchema }, { defaults: true }],
};
