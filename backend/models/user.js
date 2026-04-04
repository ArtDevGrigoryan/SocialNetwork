const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    avatar: String,
    bio: String,
    website: String,
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    status: { type: String, enum: ["ONLINE", "OFFLINE"], default: "OFFLINE" },
    token: { type: String },
    deactived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.set("toJSON", {
  transform: (_, ret) => {
    delete ret.password;
    delete ret.token;
    return ret;
  },
});

userSchema.set("toObject", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.token;
    return ret;
  },
});


module.exports = mongoose.model("User", userSchema);
