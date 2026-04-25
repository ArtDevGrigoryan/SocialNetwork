const mongoose = require("mongoose");
const cascadeDeleteChat = require("./middlewares/cascade-delete-chat");

const chatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["dm", "group"],
      default: "dm",
    },
    theme: { type: String, default: "default" },
    groupName: String,
    groupAvatar: String,

    lastMessage: {
      type: mongoose.Types.ObjectId,
      ref: "Message",
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    chatKey: String,
    messagePermission: {
      type: String,
      enum: ["everyone", "followers", "nobody"],
      default: "everyone",
    },
    pinned: [{ type: mongoose.Types.ObjectId, ref: "Message" }],
  },
  { timestamps: true },
);

chatSchema.pre(
  "deleteOne",
  { document: true, query: false },
  cascadeDeleteChat,
);

chatSchema.virtual("participants", {
  ref: "Participant",
  localField: "_id",
  foreignField: "chatId",
});

chatSchema.set("toJSON", { virtuals: true });
chatSchema.set("toObject", { virtuals: true });

chatSchema.index({ lastActivityAt: -1 });
chatSchema.index({ chatKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Chat", chatSchema);
