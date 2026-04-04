const mongoose = require("mongoose");
const User = require("@models/user");
const TwoFa = require("@models/two-factor");
const Settings = require("@models/setting");
const UserConfig = require("@models/user-config");
const { hash } = require("@helpers/utilities/password");
const { generateTokens } = require("@helpers/utilities/jwt");

module.exports = async function newUser(data, userAgent) {
  const { username, password, email } = data;
  const session = await mongoose.startSession();

  try {
    const result = { user: null, accessToken: null, refreshToken: null };

    await session.withTransaction(async () => {
      const hashedPassword = await hash(password);
      const [user] = await User.create(
        [{ username, email, password: hashedPassword }],
        {
          session,
        },
      );
      const payload = [{ user: user._id }];

      await TwoFa.create(payload, { session });
      await Settings.create(payload, { session });
      await UserConfig.create([{ user: user._id, user_agent: userAgent }], {
        session,
      });

      const jwtPayload = { id: user._id, role: user.role, email: user.email };
      const { accessToken, refreshToken } = generateTokens(jwtPayload);

      user.token = await hash(refreshToken);
      await user.save({ session });

      result.accessToken = accessToken;
      result.refreshToken = refreshToken;
      result.user = user.toObject();
    });

    return result;
  } finally {
    await session.endSession();
  }
};
