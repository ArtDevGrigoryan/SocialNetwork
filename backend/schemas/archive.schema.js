const { z } = require("zod");
const { idSchema } = require("./common.schema");

const getSchema = z.object({
  limit: z.coerce.number().int().min(10).max(50).default(20),
  cursor: z.string().nonempty().optional(),
});

const uniqueSchema = z.object({
  id: idSchema,
});

module.exports = {
  getArchivedSchema: [{ query: getSchema }, { defaults: true }],
  uniqueSchema: [{ params: uniqueSchema }],
};
