const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["TEXT", "VOICE"],
      required: true,
    },

    text: {
      type: String,
      validate: {
        validator: function (v) {
          return this.type !== "TEXT" || (v && v.trim().length > 0);
        },
      },
    },

    voiceUrl: {
      type: String,
      validate: {
        validator: function (v) {
          return this.type !== "VOICE" || !!v;
        },
      },
    },
    deletedAt: { type: Date, default: null },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

messageSchema.index({ chat: 1, createdAt: -1 });
