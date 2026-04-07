const { z } = require("zod");
const { idSchema } = require("./common.schema");

const getSchema = z.enum([
  z.object({ search: z.string().nonempty() }),
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).default(20),
  }),
]);

const followSchema = z.object({
  id: idSchema,
});

const requestSchema = z.object({
  receiver: idSchema,
});

const blockSchema = z.object({
  userId: idSchema,
});

module.exports = {
  getSchema: [{ query: getSchema }, { defaults: true }],
  followSchema: [{ params: followSchema }],
  requestSchema: [{ body: requestSchema }],
  blockSchema: [{ params: blockSchema }],
};
