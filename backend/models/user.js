const mongoose = require("mongoose");
const postInsertUser = require("@mongoose-middleware/post-create-user");

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
    friendRequests: [{ type: mongoose.Types.ObjectId, ref: "FriendRequest" }],

    posts: [{ type: mongoose.Types.ObjectId, ref: "Posts" }],
    reposts: [{ type: mongoose.Types.ObjectId, ref: "Reposts" }],
    saves: [{ type: mongoose.Types.ObjectId, ref: "Saves" }],

    isPrivate: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    userConfig: { type: mongoose.Types.ObjectId, ref: "UserConfig" },
    lastSeen: Date,
    status: { type: String, enum: ["ONLINE", "OFFLINE"], default: "OFFLINE" },

    token: { type: String },

    twoFa: { type: mongoose.Types.ObjectId, ref: "TwoFa" },
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

userSchema.post("save", postInsertUser);

module.exports = mongoose.model("User", userSchema);
