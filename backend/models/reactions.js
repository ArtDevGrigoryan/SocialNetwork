const { default: mongoose } = require("mongoose");

const reactionSchema = new mongoose.Schema({
  message: { type: mongoose.Types.ObjectId, ref: "Message" },
  participant: {
    type: mongoose.Types.ObjectId,
    ref: "Participant",
    required: true,
  },
  type: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

reactionSchema.index({ participant: 1 });

module.exports = mongoose.model("Reaction", reactionSchema);
