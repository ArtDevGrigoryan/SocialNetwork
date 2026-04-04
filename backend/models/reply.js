const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    original: { type: mongoose.Types.ObjectId, ref: "Message", required: true },
    reply: { type: mongoose.Types.ObjectId, ref: "Message", required: true },
  },
  { timestamps: true },
);

replySchema.index({ original: 1 });

module.exports = mongoose.model("Reply", replySchema);
