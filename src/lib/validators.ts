import { z } from "zod";
import {
  manualPaymentMethods,
  paymentMethodLabels
} from "@/lib/constants";

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

const bangladeshPhonePattern = /^01[3-9]\d{8}$/;
const formString = (value: unknown) => (typeof value === "string" ? value : "");
const optionalTrimmedString = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
};

export const phoneSchema = z
  .string()
  .transform((value) => normalizeBangladeshPhone(value) || "")
  .pipe(
    z
      .string()
      .regex(bangladeshPhonePattern, "Enter a valid Bangladeshi phone number.")
  );

const optionalEmailSchema = z.preprocess(
  normalizeEmail,
  z.string().email().optional()
);

const optionalPhoneSchema = z.preprocess(
  normalizeBangladeshPhone,
  z
    .string()
    .regex(bangladeshPhonePattern, "Enter a valid Bangladeshi phone number.")
    .optional()
);

const passwordSchema = z
  .preprocess(
    formString,
    z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password is too long.")
  );

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2, "Customer name is required."),
    customerPhone: phoneSchema,
    customerEmail: optionalEmailSchema,
    shippingAddress: z.string().trim().min(10, "Full shipping address is required."),
    district: z.string().trim().min(2, "District is required."),
    deliveryArea: z.string().trim().min(2, "Delivery area is required."),
    paymentMethod: z.enum([
      "cash_on_delivery",
      "bkash",
      "nagad",
      "rocket"
    ]),
    transactionId: z.string().trim().optional(),
    notes: z.string().trim().max(500).optional(),
    anonymousId: z.string().trim().max(80).optional().nullable(),
    items: z
      .array(
        z.object({
          bookId: z.string().min(1),
          quantity: z.coerce.number().int().min(1).max(99)
        })
      )
      .min(1, "Your cart is empty.")
  })
  .superRefine((value, ctx) => {
    if (
      manualPaymentMethods.includes(value.paymentMethod) &&
      !value.transactionId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["transactionId"],
        message: `Transaction ID is required for ${paymentMethodLabels[value.paymentMethod]}.`
      });
    }
  });

export const bookFormSchema = z.object({
  title: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a URL-friendly slug."),
  subtitle: z.string().trim().optional(),
  author: z.string().trim().min(2),
  publisher: z.string().trim().min(2),
  isbn13: z.string().trim().optional(),
  edition: z.string().trim().optional(),
  language: z.string().trim().min(2),
  pages: z.coerce.number().int().min(0).optional(),
  binding: z.string().trim().optional(),
  publicationDate: z.string().optional(),
  shortDescription: z.string().trim().optional(),
  description: z.string().trim().optional(),
  regularPrice: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0),
  discountPercent: z.coerce.number().int().min(0).max(100),
  discountStart: z.string().optional(),
  discountEnd: z.string().optional(),
  stockQuantity: z.coerce.number().int().min(0),
  status: z.enum([
    "draft",
    "upcoming",
    "pre_order",
    "published",
    "out_of_stock",
    "archived"
  ]),
  coverImage: z.string().trim().optional(),
  galleryImages: z.string().trim().optional(),
  samplePdf: z.string().trim().optional(),
  weight: z.coerce.number().int().min(0).optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isRecommended: z.boolean().optional()
});

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a URL-friendly slug."),
  description: z.string().trim().optional(),
  isActive: z.boolean().optional()
});

export const tagFormSchema = z.object({
  name: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a URL-friendly slug."),
  isActive: z.boolean().optional()
});

export const customerRegisterSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required."),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password.")
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Enter either an email address or a phone number."
      });
    }
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match."
      });
    }
  });

export const customerLoginSchema = z.object({
  identifier: z.preprocess(
    formString,
    z.string().trim().min(5, "Enter your email or phone number.")
  ),
  password: passwordSchema,
  redirectTo: z.preprocess(optionalTrimmedString, z.string().optional())
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
    preferredLanguages: z.array(z.string()).optional()
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Keep at least an email address or phone number on your account."
      });
    }
  });

export const customerPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password.")
  })
  .superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match."
      });
    }
  });
