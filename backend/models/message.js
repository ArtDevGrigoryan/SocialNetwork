const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    sender: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "TEXT",
        "VOICE",
        "IMAGE",
        "MEDIA",
        "MEDIA_GROUP",
        "SHARE_POST",
        "SHARE_PROFILE",
        "SHARE_STORY",
      ],
      required: true,
    },
    text: {
      type: String,
      required: function () {
        return this.type === "TEXT";
      },
      trim: true,
    },
    replyTo: {
      type: mongoose.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    voice: {
      url: {
        type: String,
        required: function () {
          return this.type === "VOICE";
        },
      },
      key: {
        type: String,
        required: function () {
          return this.type === "VOICE";
        },
      },
    },
    image: {
      url: {
        type: String,
        required: function () {
          return this.type === "IMAGE";
        },
      },
      key: {
        type: String,
        required: function () {
          return this.type === "IMAGE";
        },
      },
    },
    media: [
      {
        url: { type: String, required: true },
        key: { type: String, required: true },
        mediaType: {
          type: String,
          enum: ["IMAGE", "VIDEO", "LINK"],
          required: true,
        },
      },
    ],
    sharedPost: {
      type: mongoose.Types.ObjectId,
      ref: "Posts",
    },
    sharedProfile: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    sharedStory: {
      type: mongoose.Types.ObjectId,
      ref: "Story",
    },
    deletedAt: { type: Date, default: null },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

messageSchema.index({ chat: 1, createdAt: -1 });
module.exports = mongoose.model("Message", messageSchema);
