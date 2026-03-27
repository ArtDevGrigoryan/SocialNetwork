const router = require("express").Router();
const isAuth = require("@middlewares/is-auth");
const controller = require("@controllers/auth");
const validate = require("@middlewares/validate");
const schemas = require("@schemas/auth.schema");

router.post("/setup", isAuth, controller.setupTwoFactorAuth.bind(controller));
router.post("/verify", isAuth, validate(schemas.twoFaToken), controller.verifyTwoFactorAuth.bind(controller));
router.post("/disable",isAuth, validate(schemas.twoFaToken), controller.disableTwoFactorAuth.bind(controller));
router.post("/backup-codes", isAuth, controller.generateBackupCodes.bind(controller));
router.post("/backup-codes/verify",isAuth, validate(schemas.backupCode), controller.verifyBackupCode.bind(controller));
router.post("/backup-codes/regenerate", isAuth, controller.regenerateBackupCodes.bind(controller));
router.post("/backup-codes/disable", isAuth, controller.disableBackupCodes.bind(controller));
router.post("/backup-codes/enable", isAuth, controller.enableBackupCodes.bind(controller));
router.post("/login", validate(schemas.twoFaLogin), controller.twoFaLogin.bind(controller))


module.exports = router;
