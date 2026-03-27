const UserConfig = require("@models/user-config");

async function createUserConfig(doc) {
  const existingConfig = await UserConfig.findOne({ user: doc._id });
  if (!existingConfig) {
    const config = await UserConfig.create({
      user: doc._id,
      emailVerificationCode: "",
      emailVerificationExpires: null,
      forgotPasswordCode: "",
      forgotPasswordExpires: null,
      limitExpiration: null,
    });
    return config._id;
  }
  return null;
}

module.exports = createUserConfig;
