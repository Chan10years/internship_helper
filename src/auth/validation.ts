import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const passwordSchema = z.string().min(12).max(128);

export const registerInputSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    displayName: z.string().trim().min(1).max(40),
    inviteCode: z.string().trim().regex(/^ih_inv_[A-Za-z0-9_-]{43}$/)
  })
  .strict();

export const loginInputSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(128)
  })
  .strict();

export const passwordResetInputSchema = z
  .object({
    token: z.string().trim().regex(/^ih_reset_[A-Za-z0-9_-]{43}$/),
    password: passwordSchema
  })
  .strict();
