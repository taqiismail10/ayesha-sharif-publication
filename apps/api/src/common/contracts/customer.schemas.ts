import { z } from "zod";

/**
 * Ported 1:1 from the Next.js app's src/lib/validators.ts so validation
 * messages and normalization behavior match the documented contract
 * (docs/PHASE2_BEHAVIOR_CONTRACT.md §1–§7) exactly.
 */

export function normalizeEmail(value?: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim().toLowerCase()
    : undefined;
}

export function normalizeBangladeshPhone(value?: unknown) {
  if (typeof value !== "string") return undefined;
  const compact = value.replace(/[\s-]/g, "").trim();
  if (!compact) return undefined;
  if (compact.startsWith("+88")) return compact.slice(3);
  if (compact.startsWith("88")) return compact.slice(2);
  return compact;
}

export const bangladeshPhonePattern = /^01[3-9]\d{8}$/;

const formString = (value: unknown) => (typeof value === "string" ? value : "");

const optionalEmailSchema = z.preprocess(
  normalizeEmail,
  z.string().email().optional(),
);

const optionalPhoneSchema = z.preprocess(
  normalizeBangladeshPhone,
  z
    .string()
    .regex(bangladeshPhonePattern, "Enter a valid Bangladeshi phone number.")
    .optional(),
);

const passwordSchema = z.preprocess(
  formString,
  z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),
);

export const customerRegisterSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required."),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Enter either an email address or a phone number.",
      });
    }
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export const customerLoginSchema = z.object({
  identifier: z.preprocess(
    formString,
    z.string().trim().min(5, "Enter your email or phone number."),
  ),
  password: passwordSchema,
  // Accepted for request-shape compatibility with the old action; the API
  // ignores it — navigation is a frontend concern (contract §13.2).
  redirectTo: z.string().optional(),
});

export const customerProfileSchema = z
  .object({
    displayName: z.string().trim().min(2, "Display name is required."),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    defaultDistrict: z.string().trim().optional(),
    defaultDeliveryArea: z.string().trim().optional(),
    defaultAddress: z.string().trim().optional(),
    marketingConsent: z.boolean().optional(),
    personalizationConsent: z.boolean().optional(),
    preferredCategories: z.array(z.string()).optional(),
    preferredTags: z.array(z.string()).optional(),
    preferredLanguages: z.array(z.string()).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Keep at least an email address or phone number on your account.",
      });
    }
  });

export const customerPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
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

/**
 * Explicit output types. z.preprocess() infers `unknown` for the wrapped
 * fields, so — exactly like the old Next.js actions did with
 * `parsed.data as {...}` — we declare the post-validation shapes explicitly.
 */
export type CustomerRegisterInput = {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
};

export type CustomerLoginInput = {
  identifier: string;
  password: string;
  redirectTo?: string;
};

export type CustomerProfileInput = {
  displayName: string;
  email?: string;
  phone?: string;
  defaultDistrict?: string;
  defaultDeliveryArea?: string;
  defaultAddress?: string;
  marketingConsent?: boolean;
  personalizationConsent?: boolean;
  preferredCategories?: string[];
  preferredTags?: string[];
  preferredLanguages?: string[];
};

export type CustomerPasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
