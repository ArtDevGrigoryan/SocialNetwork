const router = require("express").Router();
const controller = require("@controllers/auth");
const validate = require("@middlewares/validate");
const isAuth = require("@middlewares/is-auth")
const schemas = require("@schemas/auth.schema");

router.post("/login", validate(schemas.login), controller.login.bind(controller));
router.post("/register", validate(schemas.register), controller.register.bind(controller));
router.post("/logout", isAuth, controller.logout.bind(controller));
router.get("/me", isAuth, controller.getCurrentUser.bind(controller));
router.post("/refresh-token", validate(schemas.refreshToken), controller.refreshToken.bind(controller));
router.post("/forgot-password", validate(schemas.forgotPassword), controller.forgotPassword.bind(controller));
router.post("/reset-password", validate(schemas.resetPassword), controller.resetPassword.bind(controller));
router.post("/verify-email", validate(schemas.verifyEmail), controller.verifyEmail.bind(controller));
router.post("/resend-verification-email", validate(schemas.resendVerificationEmail), controller.resendVerificationEmail.bind(controller));
router.post("/change-password", validate(schemas.changePassword), controller.changePassword.bind(controller));
router.post("/update-profile", validate(schemas.updateProfile), controller.updateProfile.bind(controller));
router.post("/delete-account", isAuth, controller.deleteAccount.bind(controller));
router.get("/oauth/:provider", validate(schemas.oauth), controller.oauthLogin.bind(controller));
router.get("/oauth/:provider/callback", validate(schemas.oauth), controller.oauthCallback.bind(controller));
router.post("/2fa/setup", isAuth, controller.setupTwoFactorAuth.bind(controller));
router.post("/2fa/verify", isAuth, validate(schemas.twoFaToken), controller.verifyTwoFactorAuth.bind(controller));
router.post("/2fa/disable",isAuth, validate(schemas.twoFaToken), controller.disableTwoFactorAuth.bind(controller));
router.post("/2fa/backup-codes", isAuth, controller.generateBackupCodes.bind(controller));
router.post("/2fa/backup-codes/verify",isAuth, validate(schemas.backupCode), controller.verifyBackupCode.bind(controller));
router.post("/2fa/backup-codes/regenerate", isAuth, controller.regenerateBackupCodes.bind(controller));
router.post("/2fa/backup-codes/disable", isAuth, controller.disableBackupCodes.bind(controller));
router.post("/2fa/backup-codes/enable", isAuth, controller.enableBackupCodes.bind(controller));
router.post("/2fa/login", validate(schemas.twoFaLogin), controller.twoFaLogin.bind(controller))

module.exports = router;