const mongoose = require("mongoose");

const twoFaSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },

    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    twoFactorTempSecret: { type: String },

    backupCodes: [
      {
        code: { type: String },
        used: { type: Boolean, default: false },
      },
    ],

    backupCodesEnabled: { type: Boolean, default: false },
  },
  { timeseries: true },
);

module.exports = mongoose.model("TwoFa", twoFaSchema);
