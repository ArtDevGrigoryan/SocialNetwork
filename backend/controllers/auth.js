const { sendSuccess } = require("../helpers/api-response");

class AuthController {
  constructor() {
    this.service = require("../services/auth.service");
  }
  async login(req, res) {
    const data = await this.service.login(req.validated);
    return sendSuccess(res, data);
  }
  async register(req, res) {
    const data = await this.service.register(req.validated);
    return sendSuccess(res, data, 201);
  }
  async logout(req, res) {
    await this.service.logout(req.user);
    return sendSuccess(res, null, 204, "Logged out successfully");
  }
  async getCurrentUser(req, res) {
    const data = await this.service.getCurrentUser(req.user);
    return sendSuccess(res, data);
  }
  async refreshToken(req, res) {
    const data = await this.service.refreshToken(req.body.refreshToken);
    return sendSuccess(res, data);
  }
  async forgotPassword(req, res) {
    await this.service.forgotPassword(req.validated);
    return sendSuccess(res, null, 200, "Password reset email sent");
  }
  async resetPassword(req, res) {
    await this.service.resetPassword(req.validated);
    return sendSuccess(res, null, 200, "Password reset successful");
  }
  async verifyEmail(req, res) {
    await this.service.verifyEmail(req.validated);
    return sendSuccess(res, null, 200, "Email verified successfully");
  }
  async resendVerificationEmail(req, res) {
    await this.service.resendVerificationEmail(req.validated);
    return sendSuccess(res, null, 200, "Verification email resent");
  }
  async changePassword(req, res) {
    await this.service.changePassword(req.user, req.validated);
    return sendSuccess(res, null, 200, "Password changed successfully");
  }
  async updateProfile(req, res) {
    const data = await this.service.updateProfile(req.user, req.validated);
    return sendSuccess(res, data, 200, "Profile updated successfully");
  }
  async deleteAccount(req, res) {
    await this.service.deleteAccount(req.user);
    return sendSuccess(res, null, 204, "Account deleted successfully");
  }
  async oauthLogin(req, res) {
    const data = await this.service.oauthLogin(req.params.provider);
    return sendSuccess(res, data);
  }
  async oauthCallback(req, res) {
    const data = await this.service.oauthCallback(
      req.params.provider,
      req.query,
    );
    return sendSuccess(res, data);
  }
  async setupTwoFactorAuth(req, res) {
    const data = await this.service.setupTwoFactorAuth(req.user);
    return sendSuccess(res, data);
  }
  async verifyTwoFactorAuth(req, res) {
    await this.service.verifyTwoFactorAuth(req.user, req.validated);
    return sendSuccess(res, null, 200, "Two-factor authentication verified");
  }
  async disableTwoFactorAuth(req, res) {
    await this.service.disableTwoFactorAuth(req.user);
    return sendSuccess(res, null, 200, "Two-factor authentication disabled");
  }
  async generateBackupCodes(req, res) {
    const data = await this.service.generateBackupCodes(req.user);
    return sendSuccess(res, data);
  }
  async verifyBackupCode(req, res) {
    await this.service.verifyBackupCode(req.user, req.validated);
    return sendSuccess(res, null, 200, "Backup code verified");
  }
  async regenerateBackupCodes(req, res) {
    const data = await this.service.regenerateBackupCodes(req.user);
    return sendSuccess(res, data);
  }
  async disableBackupCodes(req, res) {
    await this.service.disableBackupCodes(req.user);
    return sendSuccess(res, null, 200, "Backup codes disabled");
  }
  async enableBackupCodes(req, res) {
    const data = await this.service.enableBackupCodes(req.user);
    return sendSuccess(res, data);
  }
}

module.exports = new AuthController();
