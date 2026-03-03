const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  twoFactorTempSecret: { type: String },
  emailVerificationCode: String,
  backupCodes: [
    {
      code: String,
      used: { type: Boolean, default: false },
    },
  ],

  backupCodesEnabled: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", userSchema);
