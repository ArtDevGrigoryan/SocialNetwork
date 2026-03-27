const { z } = require("zod");
const { idSchema } = require("./common.schema");

module.exports.joinRoomSchema = z.object({
  chatId: idSchema,
});
