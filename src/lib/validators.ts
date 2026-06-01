import { z } from "zod";
import {
  manualPaymentMethods,
  paymentMethodLabels
} from "@/lib/constants";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+?88)?01[3-9]\d{8}$/, "Enter a valid Bangladeshi phone number.");

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2, "Customer name is required."),
    customerPhone: phoneSchema,
    customerEmail: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.string().email().optional()
    ),
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
