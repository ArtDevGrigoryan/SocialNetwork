const mongoose = require("mongoose");

const configSchema = new mongoose.Schema({
  user: { type: mongoose.Types.ObjectId, ref: "User", unique: true },
  user_agent: { type: String },
  isVerified: { type: Boolean, default: false },
  emailVerificationCode: String,
  emailVerificationExpires: Date,
  forgotPasswordCode: String,
  forgotPasswordExpires: Date,
  limit: { type: Number, default: 0 },
  limitExpiration: Date,
});

module.exports = mongoose.model("UserConfig", configSchema);
