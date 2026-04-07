const { z } = require("zod");
const mongoose = require("mongoose");

module.exports.passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character");

module.exports.emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email format");

module.exports.idSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  });

module.exports.paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limt: z.coerce.number().int().min(1).default(20),
});
