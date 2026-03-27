const { z } = require("zod");
const { emailSchema, passwordSchema, idSchema } = require("./common.schema");

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().nonempty("Missing name"),
});
const refreshTokenSchema = z.object({
  refreshToken: z.string().nonempty("Missing refresh token"),
});
const forgotPasswordSchema = z.object({ email: emailSchema });
const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
  email: emailSchema,
  code: z.string().nonempty(),
});
const verifyEmailSchema = z.object({
  code: z.string().nonempty("Missing verification code"),
});
const resendVerificationEmailSchema = z.object({ email: emailSchema });
const changePasswordSchema = z.object({
  oldPassword: passwordSchema,
  newPassword: passwordSchema,
});
const updateProfileSchema = z.object({
  name: z.string().nonempty("Missing name"),
});

const oauthSchema = z.object({
  provider: z.enum(["google", "github"]),
});
const verifyTwoFactorAuthSchema = z.object({
  token: z.string().nonempty("Missing two factor verification token"),
  userId: idSchema.optional(),
});

const verifyBackupCodeSchema = z.object({
  code: z.string().nonempty("Missing code"),
});

const twoFaLoginSchema = z
  .object({
    userId: idSchema,
    token: z.string().optional(),
    backupCode: z.string().optional(),
  })
  .refine((data) => !!data.token || !!data.backupCode, {
    message: "Either token or backupCode is required",
    path: ["token | backupCode"],
  });

module.exports = {
  login: [{ body: loginSchema }],
  register: [{ body: registerSchema }],
  refreshToken: [{ body: refreshTokenSchema }],
  forgotPassword: [{ body: forgotPasswordSchema }],
  resetPassword: [{ body: resetPasswordSchema }],
  verifyEmail: [{ body: verifyEmailSchema }],
  resendVerificationEmail: [{ body: resendVerificationEmailSchema }],
  changePassword: [{ body: changePasswordSchema }],
  updateProfile: [{ body: updateProfileSchema }],
  oauth: [oauthSchema],
  twoFaToken: [verifyTwoFactorAuthSchema],
  backupCode: [verifyBackupCodeSchema],
  twoFaLogin: [twoFaLoginSchema],
};
