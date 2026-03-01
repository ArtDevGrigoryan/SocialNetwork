const router = require("express").Router();
const authController = require("../controllers/auth");
router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/logout", authController.logout);
router.get("/me", authController.getCurrentUser);
router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification-email", authController.resendVerificationEmail);
router.post("/change-password", authController.changePassword);
router.post("/update-profile", authController.updateProfile);
router.post("/delete-account", authController.deleteAccount);
router.get("/oauth/:provider", authController.oauthLogin);
router.get("/oauth/:provider/callback", authController.oauthCallback);
router.post("/2fa/setup", authController.setupTwoFactorAuth);
router.post("/2fa/verify", authController.verifyTwoFactorAuth);
router.post("/2fa/disable", authController.disableTwoFactorAuth);
router.post("/2fa/backup-codes", authController.generateBackupCodes);
router.post("/2fa/backup-codes/verify", authController.verifyBackupCode);
router.post("/2fa/backup-codes/regenerate", authController.regenerateBackupCodes);
router.post("/2fa/backup-codes/disable", authController.disableBackupCodes);
router.post("/2fa/backup-codes/enable", authController.enableBackupCodes);


module.exports = router;