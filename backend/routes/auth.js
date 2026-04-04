const router = require("express").Router();
const controller = require("@controllers/auth");
const validate = require("@middlewares/validate");
const userAgent = require("@middlewares/user-agent");
const isAuth = require("@middlewares/is-auth")
const schemas = require("@schemas/auth.schema");
const twoFaRouter = require("@routes/auth-2fa");

router.post("/login", validate(schemas.login), userAgent, controller.login.bind(controller));
router.post("/register", validate(schemas.register), userAgent,controller.register.bind(controller));
router.post("/logout", isAuth, controller.logout.bind(controller));
router.get("/me", isAuth, controller.getCurrentUser.bind(controller));
router.post("/refresh-token", validate(schemas.refreshToken), controller.refreshToken.bind(controller));
router.post("/forgot-password", validate(schemas.forgotPassword), controller.forgotPassword.bind(controller));
router.post("/reset-password", validate(schemas.resetPassword), controller.resetPassword.bind(controller));
router.post("/verify-email", isAuth, validate(schemas.verifyEmail), controller.verifyEmail.bind(controller));
router.post("/resend-verification", isAuth, validate(schemas.resendVerificationEmail), controller.resendVerificationEmail.bind(controller));
router.post("/change-password", isAuth, validate(schemas.changePassword), controller.changePassword.bind(controller));
router.patch("/update-profile", isAuth, validate(schemas.updateProfile), controller.updateProfile.bind(controller));
router.delete("/", isAuth, controller.deleteAccount.bind(controller));
router.get("/oauth/:provider", validate(schemas.oauth), controller.oauthLogin.bind(controller));
router.get("/oauth/:provider/callback", validate(schemas.oauth), controller.oauthCallback.bind(controller));
router.use("/2fa", twoFaRouter);

module.exports = router;