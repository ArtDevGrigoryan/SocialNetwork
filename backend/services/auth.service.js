const User = require("../models/user");
const {
  generateTokens,
  verifyRefreshToken,
} = require("../helpers/utilities/jwt");
const { NotFoundException, UnauthorizedException } = require("../utils/errors");
const { hash, compare } = require("../helpers/utilities/password");

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

    const newAccessToken = generateAccessToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    return { accessToken: newAccessToken, refreshToken };
  }
  async forgotPassword(data) {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new NotFoundException("User with this email does not exist");
    }
    await emailService.sendPasswordResetEmail(user.email, user._id);
    return true;
  }
  async resetPassword(data) {
    const user = await User.findById(data.email);
    if (!user) {
      throw new NotFoundException("User with this email does not exist");
    }
    const hashedPassword = await hash(data.newPassword);
    user.password = hashedPassword;
    await user.save();
    return true;
  }
  async verifyEmail(data) {
    const user = await User.findById(data.email);
    if (!user) {
      throw new NotFoundException("User with this email does not exist");
    }
    if (user.isVerified) {
      throw new ConflictException("Email is already verified");
    }
    if (data.code != user.verificationCode) {
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
    await emailService.sendVerificationEmail(user.email, user._id);
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
    if (!["google", "facebook", "github"].includes(provider)) {
      throw new BadRequestException("Unsupported OAuth provider");
    }
    // Implement OAuth login logic (e.g., redirect to provider's auth page)
  }
  async oauthCallback(provider, query) {
    // Implement OAuth callback logic (e.g., handle provider's response and authenticate user)
  }
  async setupTwoFactorAuth(user) {
    // Implement 2FA setup logic (e.g., generate secret and QR code)
  }
  async verifyTwoFactorAuth(user, data) {
    // Implement 2FA verification logic (e.g., verify TOTP code)
  }
  async disableTwoFactorAuth(user) {
    // Implement 2FA disable logic (e.g., remove 2FA secret from user)
  }
  async generateBackupCodes(user) {
    // Implement backup codes generation logic (e.g., generate and store backup codes)
  }
  async verifyBackupCode(user, data) {
    // Implement backup code verification logic (e.g., verify provided backup code)
  }
  async regenerateBackupCodes(user) {
    // Implement backup codes regeneration logic (e.g., invalidate old codes and generate new ones)
  }
  async disableBackupCodes(user) {
    // Implement backup codes disable logic (e.g., remove backup codes from user)
  }
  async enableBackupCodes(user) {
    // Implement backup codes enable logic (e.g., generate and store backup codes if not already enabled)
  }
}

module.exports = new AuthService();
