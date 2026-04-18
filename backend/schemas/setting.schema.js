const { z } = require("zod");

module.exports.notificationSchema = z.object({
  type: z.enum([
    "accept_request",
    "decline_request",
    "cancel_request",
    "follow",
    "like",
    "unfollow",
    "group_member_removed",
    "group_removed",
    "group_member_removed_notice",
    "message",
    "new_group",
    "new_post",
    "new_story",
  ]),
});
