const User = require("../models/user");
const {
  generateTokens,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../helpers/utilities/jwt");
const generateCode = require("../helpers/utilities/random-code");
const {
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} = require("../helpers/errors/index");
const { hash, compare } = require("../helpers/utilities/password");
const emailService = require("./email.service");
const oauthService = require("./oauth.service");
const twoFactorService = require("./two-factor.service");

class AuthService {
  async login(data) {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new NotFoundException("Invalid email or password");
    }
    const isPasswordValid = await compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new NotFoundException("Invalid email or password");
    }
    const accessToken = generateAccessToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });
    user.lastLogin = new Date();
    user.token = hash(refreshToken);
    await user.save();
    return { accessToken, refreshToken, user };
  }
  async register(data) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictException("Email already in use");
    }
    const hashedPassword = await hash(data.password);
    const user = new User({
      email: data.email,
      password: hashedPassword,
      name: data.name,
    });
    const jwtPayload = {
      email: user.email,
      role: user.role,
      id: user._id,
    };
    const { accessToken, refreshToken } = generateTokens(jwtPayload);
    user.token = hash(refreshToken);
    await user.save();
    return { accessToken, refreshToken, user };
  }
  async logout(user) {
    user.token = null;
    await user.save();
    return true;
  }
  async getCurrentUser(user) {
    return user;
  }
  async refreshToken(refreshToken) {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const user = await User.findById(payload.id);
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
    const code = generateCode();
    user.emailVerificationCode = code;
    await emailService.sendPasswordResetEmail(user.email, code);
    return true;
  }
  async resetPassword(data) {
    const user = await User.findById(data.user._id);
    if (!user) {
      throw new NotFoundException("User with this email does not exist");
    }
    const hashedPassword = await hash(data.newPassword);
    user.password = hashedPassword;
    await user.save();
    return true;
  }
  async verifyEmail(data) {
    const user = await User.findById(data.user._id);
    if (!user) {
      throw new NotFoundException("User with this email does not exist");
    }
    if (user.isVerified) {
      throw new ConflictException("Email is already verified");
    }
    if (data.code != user.emailVerificationCode) {
      throw new ConflictException("Invalid verification code");
    }
    user.isVerified = true;
    await user.save();
    return true;
  }
  async resendVerificationEmail(data) {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new NotFoundException("User with this email does not exist");
    }
    if (user.isVerified) {
      throw new ConflictException("Email is already verified");
    }
    const code = generateCode();
    user.emailVerificationCode = code;
    await user.save();
    await emailService.sendVerificationEmail(user.email, code);
    return true;
  }
  async changePassword(data) {
    const user = await User.findById(data.user._id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const isPasswordValid = await compare(data.oldPassword, user.password);
    if (!isPasswordValid) {
      throw new ConflictException("Old password is incorrect");
    }
    const hashedPassword = await hash(data.newPassword);
    user.password = hashedPassword;
    await user.save();
    return true;
  }
  async updateProfile(data) {
    const user = await User.findById(data.user._id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (data.name) user.name = data.name;
    await user.save();
    return user;
  }
  async deleteAccount(user) {
    await User.findByIdAndDelete(user._id);
    return true;
  }
  async oauthLogin(provider) {
    provider = provider.toLowerCase();
    if (!["google", "github"].includes(provider)) {
      throw new BadRequestException("Unsupported OAuth provider");
    }
    const res = oauthService.getAuthUrl(provider);
    console.log(res);
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
    let user = await User.findOne({ email: data.user.email });
    if (!user) {
      user = new User({
        email: data.user.email,
        name: data.user.name,
        isVerified: data.user.emailVerified,
      });
      await user.save();
    }

    const accessToken = generateAccessToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });
    user.lastLogin = new Date();
    user.token = hash(refreshToken);
    await user.save();
    return { accessToken, refreshToken, user };
  }
  async setupTwoFactorAuth(user) {
    const currUser = await User.findById(user._id);
    const secret = twoFactorService.generateSecret(user.email);
    currUser.twoFactorTempSecret = secret.base32;
    await currUser.save();
    const QR = await twoFactorService.generateQRCode(secret.otpauth_url);
    return QR;
  }
  async verifyTwoFactorAuth(user, data) {
    const { token } = data;

    const isValid = twoFactorService.verifyToken(
      user.twoFactorTempSecret,
      token,
    );

    if (!isValid) {
      throw new BadRequestException("Invalid code");
    }

    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = null;
    user.twoFactorEnabled = true;

    await user.save();

    return true;
  }
  async disableTwoFactorAuth(user, data) {
    const { token } = data;

    const isValid = twoFactorService.verifyToken(user.twoFactorSecret, token);

    if (!isValid) {
      throw new BadRequestException("Invalid code");
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.backupCodes = [];

    await user.save();
    return true;
  }
  async generateBackupCodes(user) {
    const rawCodes = twoFactorService.generateBackupCodes();

    user.backupCodes = rawCodes.map((code) => ({
      code: twoFactorService.hashCode(code),
      used: false,
    }));

    user.backupCodesEnabled = true;

    await user.save();

    return rawCodes;
  }
  async verifyBackupCode(user, data) {
    const { code } = data;

    const hashed = twoFactorService.hashCode(code);
    const match = user.backupCodes.find((c) => c.code === hashed && !c.used);

    if (!match) {
      throw new BadRequestException("Invalid backup code");
    }

    match.used = true;
    await user.save();

    return true;
  }
  async regenerateBackupCodes(user) {
    const rawCodes = twoFactorService.generateBackupCodes();
    user.backupCodes = rawCodes.map((code) => ({
      code: twoFactorService.hashCode(code),
      used: false,
    }));

    await user.save();

    return rawCodes;
  }
  async disableBackupCodes(user) {
    user.backupCodes = [];
    user.backupCodesEnabled = false;

    await user.save();

    return true;
  }
  async enableBackupCodes(user) {
    user.backupCodesEnabled = true;
    await user.save();
    return true;
  }
}

module.exports = new AuthService();
