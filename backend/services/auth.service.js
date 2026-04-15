const User = require("@models/user");
const UserConfig = require("@models/user-config");
const {
  generateTokens,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("@utilities/jwt");
const generateCode = require("@utilities/random-code");
const {
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} = require("@helpers/errors/index");
const { hash, compare } = require("@utilities/password");
const emailService = require("@lib/email.service");
const oauthService = require("@lib/oauth.service");
const twoFactorService = require("@services/two-factor.service");
const env = require("@helpers/env");
const TwoFactor = require("@models/two-factor");
const newUserTx = require("@transaction/new-user");

class AuthService {
  async login(data, userAgent) {
    console.log(userAgent);
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new NotFoundException("Invalid email or password");
    }
    if (user.deactived) {
      throw new ConflictException(
        "This acccount deactived please contact the support team",
      );
    }
    const isPasswordValid = await compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new NotFoundException("Invalid email or password");
    }
    if (user.twoFactorEnabled) {
      return { twoFactorCredintals: true, userId: user._id };
    }
    const { accessToken, refreshToken } = generateTokens({
      id: user._id,
      email: user.email,
      role: user.role,
    });
    user.lastLogin = new Date();
    user.token = await hash(refreshToken);
    await user.save();
    const userObj = user.toObject();
    return { accessToken, refreshToken, user: userObj };
  }
  async register(data, userAgent) {
    console.log(userAgent);
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictException("Email already in use");
    }
    return await newUserTx(
      {
        username: data.name,
        email: data.email,
        password: data.password,
      },
      userAgent,
    );
  }
  async logout(user) {
    user.token = null;
    await user.save();
    return true;
  }
  getCurrentUser(user) {
    return user.toObject();
  }
  async refreshToken(refreshToken) {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const user = await User.findById(payload.id);
    if (user.deactived) {
      throw new ConflictException(
        "This acccount deactived please contact the support team",
      );
    }
    if (!user || !user.token) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const isTokenValid = await compare(refreshToken, user.token);
    if (!isTokenValid) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const payloadJWT = {
      id: user._id,
      email: user.email,
      role: user.role,
    };
    const newAccessToken = generateAccessToken(payloadJWT);
    const newRefreshToken = generateRefreshToken(payloadJWT);
    user.token = await hash(newRefreshToken);
    await user.save();
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
  async forgotPassword(data) {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new NotFoundException("User with this email does not exist");
    }
    if (user.deactived) {
      throw new ConflictException(
        "This acccount deactived please contact the support team",
      );
    }
    const config = await this.handleUserConfigExpiration(user._id);

    const code = generateCode();
    const codeExpiration = new Date(Date.now() + 15 * 60 * 1000);
    config.forgotPasswordCode = await hash(code);
    config.forgotPasswordExpires = codeExpiration;
    await config.save();
    await emailService.sendPasswordResetEmail(user.email, code);
    return true;
  }
  async resetPassword(data) {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new NotFoundException("User with this email does not exist");
    }
    if (user.deactived) {
      throw new ConflictException(
        "This acccount deactived please contact the support team",
      );
    }
    const config = await this.handleUserConfigExpiration(user._id);

    if (!config.forgotPasswordCode) {
      throw new BadRequestException("No active password reset request");
    }
    const isMatch = await compare(data.code, config.forgotPasswordCode);
    if (!isMatch) {
      await config.updateOne({ $inc: { limit: 1 } });
      throw new BadRequestException("Invalid or incorrect code");
    }
    const now = Date.now();
    if (config.forgotPasswordExpires?.getTime() < now) {
      await config.updateOne({ $inc: { limit: 1 } });
      throw new ConflictException("Verification code has expired");
    }

    const hashedPassword = await hash(data.newPassword);
    user.password = hashedPassword;
    await user.save();
    await config.updateOne({
      limit: 0,
      limitExpiration: null,
      forgotPasswordCode: "",
      forgotPasswordExpires: null,
    });
    const userObj = user.toObject();
    const { accessToken, refreshToken } = generateTokens({
      id: user._id,
      email: user.email,
      role: user.role,
    });
    return { accessToken, refreshToken, user: userObj };
  }
  async verifyEmail(data, account) {
    const user = await User.findById(account._id);
    if (!user) {
      throw new NotFoundException("User with this email does not exist");
    }
    if (user.deactived) {
      throw new ConflictException(
        "This acccount deactived please contact the support team",
      );
    }
    const config = await this.handleUserConfigExpiration(user._id);

    if (!config.emailVerificationCode) {
      throw new BadRequestException("No active email verification request");
    }
    const isMatch = await compare(data.code, config.emailVerificationCode);
    if (!isMatch) {
      await config.updateOne({ $inc: { limit: 1 } });
      throw new ConflictException("Invalid verification code");
    }
    if (config.emailVerificationExpires?.getTime() < Date.now()) {
      await config.updateOne({ $inc: { limit: 1 } });
      throw new ConflictException("Verification code has expired");
    }
    await config.updateOne({
      limit: 0,
      limitExpiration: null,
      emailVerificationCode: "",
      emailVerificationExpires: null,
      isVerified: true,
    });
    return true;
  }
  async handleUserConfigExpiration(user) {
    const config = await UserConfig.findOne({ user });

    if (config.isVerified) {
      throw new ConflictException("Please contact the support team");
    }
    if (config.limit >= env.FAILED_LIMIT) {
      if (!config.limitExpiration) {
        config.limitExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await config.save();
        const diff = config.limitExpiration.getTime() - Date.now();
        const hours = Math.ceil(diff / (60 * 60 * 1000));
        throw new ConflictException(
          `Too many failed attempts. Try again in ${hours} hours`,
        );
      } else if (config.limitExpiration?.getTime() > Date.now()) {
        const diff = config.limitExpiration.getTime() - Date.now();
        const hours = Math.ceil(diff / (60 * 60 * 1000));
        throw new BadRequestException(
          `Too many attempts. Try again in ${hours} hours`,
        );
      } else {
        config.limit = 0;
        config.limitExpiration = null;
        await config.save();
      }
    }
    return config;
  }
  async resendVerificationEmail(data) {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new NotFoundException("User with this email does not exist");
    }
    if (user.deactived) {
      throw new ConflictException(
        "This acccount deactived please contact the support team",
      );
    }
    const config = await this.handleUserConfigExpiration(user._id);

    const code = generateCode();
    config.emailVerificationCode = await hash(code);
    config.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await config.save();
    await emailService.sendVerificationEmail(user.email, code);
    return true;
  }
  async changePassword(data, account) {
    const user = await User.findById(account._id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.deactived) {
      throw new ConflictException(
        "This acccount deactived please contact the support team",
      );
    }
    const isPasswordValid = await compare(data.oldPassword, user.password);
    if (!isPasswordValid) {
      throw new ConflictException("Old password is incorrect");
    }

    user.password = await hash(data.newPassword);
    await user.save();
    return true;
  }
  async updateProfile(data, account) {
    const user = await User.findById(account._id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.deactived) {
      throw new ConflictException(
        "This acccount deactived please contact the support team",
      );
    }
    if (data.name) user.username = data.name;
    await user.save();
    return user;
  }
  async deleteAccount(user) {
    await User.findByIdAndUpdate(user._id, { deactived: true });
    return true;
  }
  async oauthLogin(provider) {
    provider = provider.toLowerCase();
    if (!["google", "github"].includes(provider)) {
      throw new BadRequestException("Unsupported OAuth provider");
    }
    const res = oauthService.getAuthUrl(provider);
    return res;
  }
  async oauthCallback(provider, query) {
    provider = provider.toLowerCase();
    if (!["google", "github"].includes(provider)) {
      throw new BadRequestException("Unsupported OAuth provider");
    }
    query = query || {};
    const data = await oauthService.getUserFromCode(
      provider,
      query.code,
      query.state,
    );
    if (!data) {
      throw new BadRequestException("Invalid Credintals");
    }
    let user = await User.findOne({ email: data.email });
    if (!user) {
      user = new User({
        email: data.email,
        name: data.name,
        isVerified: data.emailVerified,
        avatar: data.avatar,
      });
      await user.save();
    }
    const { accessToken, refreshToken } = generateTokens({
      id: user._id,
      email: user.email,
      role: user.role,
    });
    user.avatar = user.avatar ?? data.avatar;
    user.lastLogin = new Date();
    user.token = await hash(refreshToken);
    await user.save();
    const current = await User.findById(user._id).select(
      "-password -backupCodes -emailVerificationCode -twoFactorTempSecret -twoFactorSecret",
    );
    return { accessToken, refreshToken, user: current };
  }
  async setupTwoFactorAuth(user) {
    if (user.deactived) {
      throw new ConflictException(
        "This acccount deactived please contact the support team",
      );
    }
    const twoFa = await TwoFactor.findOne({ user: user._id });

    const secret = twoFactorService.generateSecret(user.email);
    twoFa.twoFactorTempSecret = secret.base32;

    await twoFa.save();
    const QR = await twoFactorService.generateQRCode(secret.otpauth_url);
    return { qrCode: QR, secret: secret.base32 };
  }
  async verifyTwoFactorAuth(user, data) {
    const { token } = data;
    const twoFa = await TwoFactor.findOne({ user: user._id });

    const isValid = twoFactorService.verifyToken(
      twoFa.twoFactorTempSecret,
      token,
    );

    if (!isValid) {
      throw new BadRequestException("Invalid or incorrect code");
    }

    twoFa.twoFactorSecret = twoFa.twoFactorTempSecret;
    twoFa.twoFactorTempSecret = null;
    twoFa.twoFactorEnabled = true;

    await twoFa.save();

    return true;
  }
  async disableTwoFactorAuth(user, data) {
    const { token, userId } = data;
    if (user.role == "admin" && user._id != userId) {
      const twoFa = await TwoFactor.findOne({ user: userId });
      if (!twoFa) {
        throw new BadRequestException("User not found");
      }
      twoFa.twoFactorEnabled = false;
      twoFa.twoFactorSecret = null;
      twoFa.backupCodes = [];

      await twoFa.save();
      return true;
    }
    const twoFa = await TwoFactor.findById(user.twoFa);
    const isValid = twoFactorService.verifyToken(twoFa.twoFactorSecret, token);

    if (!isValid) {
      throw new BadRequestException("Invalid or incorrect code");
    }

    twoFa.twoFactorEnabled = false;
    twoFa.twoFactorSecret = null;
    twoFa.backupCodes = [];

    await twoFa.save();
    return true;
  }
  async generateBackupCodes(user) {
    const twoFa = await TwoFactor.findOne({ user: user._id });
    const rawCodes = twoFactorService.generateBackupCodes();

    twoFa.backupCodes = rawCodes.map((code) => ({
      code: twoFactorService.hashCode(code),
      used: false,
    }));

    twoFa.backupCodesEnabled = true;

    await twoFa.save();

    return rawCodes;
  }
  async verifyBackupCode(user, data) {
    const { code } = data;
    const twoFa = await TwoFactor.findOne({ user: user._id });

    const hashed = twoFactorService.hashCode(code);
    const match = twoFa.backupCodes.find((c) => c.code === hashed && !c.used);

    if (!match) {
      throw new BadRequestException("Invalid backup code");
    }

    match.used = true;
    await twoFa.save();

    return true;
  }
  async regenerateBackupCodes(user) {
    const twoFa = await TwoFactor.findOne({ user: user._id });
    const rawCodes = twoFactorService.generateBackupCodes();
    twoFa.backupCodes = rawCodes.map((code) => ({
      code: twoFactorService.hashCode(code),
      used: false,
    }));

    await twoFa.save();

    return rawCodes;
  }
  async disableBackupCodes(user) {
    const twoFa = await TwoFactor.findOne({ user: user._id });

    twoFa.backupCodes = [];
    twoFa.backupCodesEnabled = false;

    await twoFa.save();

    return true;
  }
  async enableBackupCodes(user) {
    const twoFa = await TwoFactor.findOne({ user: user._id });

    twoFa.backupCodesEnabled = true;
    await twoFa.save();
    return true;
  }
  async twoFaLogin(data) {
    const { token, backupCode, userId } = data;
    const [user, twoFa] = await Promise.all([
      User.findById(userId),
      TwoFactor.findOne({ user: userId }),
    ]);
    if (!twoFa || !user) {
      throw new NotFoundException("User not found");
    }
    if (token) {
      const isValid = twoFactorService.verifyToken(
        twoFa.twoFactorSecret,
        token,
      );
      if (!isValid) {
        throw new BadRequestException("Invalid token");
      }
      return generateTokens({
        id: user._id,
        email: user.email,
        role: user.role,
      });
    } else {
      const index = twoFactorService.verifyBackupCode(
        backupCode,
        twoFa.backupCodes,
      );
      if (index < 0) {
        throw new BadRequestException("Invalid backup code");
      }
      twoFa.backupCodes[index].used = true;
      await twoFa.save();

      return generateTokens({
        id: user._id,
        email: user.email,
        role: user.role,
      });
    }
  }
}

module.exports = new AuthService();
