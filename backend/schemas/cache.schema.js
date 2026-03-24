const { z } = require("zod");
const { idSchema } = require("./common.schema");

module.exports.cacheKeySchema = z.string().nonempty();

// const userSchema = (userSchema = z.object({
//   id: idSchema,
//   socketId: z.string().nonempty(),
// }));
module.exports.joinRoomSchema = z.object({
  roomId: idSchema,
  users: z.array(this.userSchema),
});

module.exports.userSchema = z.object({
  id: idSchema,
  socketId: z.string().nonempty(),
});
