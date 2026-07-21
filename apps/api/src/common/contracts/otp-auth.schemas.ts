import { z } from "zod";
import { normalizeEmail } from "./customer.schemas";

const emailSchema = z.preprocess(
  normalizeEmail,
  z.string().email("Enter a valid email address."),
);

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.");

export const signupOtpRequestSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required.").max(120),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export const emailOnlySchema = z.object({ email: emailSchema });

export const verifyOtpSchema = emailOnlySchema.extend({
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const resetPasswordSchema = emailOnlySchema
  .extend({
    resetToken: z.string().min(32, "The reset session is invalid."),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export type SignupOtpRequestInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type EmailOnlyInput = { email: string };
export type VerifyOtpInput = EmailOnlyInput & { otp: string };
export type ResetPasswordInput = EmailOnlyInput & {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
};
