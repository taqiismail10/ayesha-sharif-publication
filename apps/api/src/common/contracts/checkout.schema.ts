import { z } from "zod";
import {
  bangladeshPhonePattern,
  normalizeBangladeshPhone,
  normalizeEmail,
} from "./customer.schemas";

/**
 * Ported 1:1 from src/lib/validators.ts checkoutSchema so messages and
 * normalization match docs/PHASE2_BEHAVIOR_CONTRACT.md §8 exactly.
 */

const manualPaymentMethods = ["bkash", "nagad", "rocket"] as const;

const paymentMethodLabels: Record<string, string> = {
  cash_on_delivery: "Cash on Delivery",
  bkash: "Manual bKash",
  nagad: "Manual Nagad",
  rocket: "Manual Rocket",
};

const phoneSchema = z
  .string()
  .transform((value) => normalizeBangladeshPhone(value) || "")
  .pipe(
    z
      .string()
      .regex(bangladeshPhonePattern, "Enter a valid Bangladeshi phone number."),
  );

const optionalEmailSchema = z.preprocess(
  normalizeEmail,
  z.string().email().optional(),
);

export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2, "Customer name is required."),
    customerPhone: phoneSchema,
    customerEmail: optionalEmailSchema,
    shippingAddress: z
      .string()
      .trim()
      .min(10, "Full shipping address is required."),
    district: z.string().trim().min(2, "District is required."),
    deliveryArea: z.string().trim().min(2, "Delivery area is required."),
    paymentMethod: z.enum(["cash_on_delivery", "bkash", "nagad", "rocket"]),
    transactionId: z.string().trim().optional(),
    notes: z.string().trim().max(500).optional(),
    anonymousId: z.string().trim().max(80).optional().nullable(),
    items: z
      .array(
        z.object({
          bookId: z.string().min(1),
          quantity: z.coerce.number().int().min(1).max(99),
        }),
      )
      .min(1, "Your cart is empty."),
  })
  .superRefine((value, ctx) => {
    if (
      (manualPaymentMethods as readonly string[]).includes(
        value.paymentMethod,
      ) &&
      !value.transactionId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["transactionId"],
        message: `Transaction ID is required for ${paymentMethodLabels[value.paymentMethod]}.`,
      });
    }
  });

/** Post-validation shape (explicit — zod preprocess infers unknown). */
export type CheckoutInput = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  district: string;
  deliveryArea: string;
  paymentMethod: "cash_on_delivery" | "bkash" | "nagad" | "rocket";
  transactionId?: string;
  notes?: string;
  anonymousId?: string | null;
  items: Array<{ bookId: string; quantity: number }>;
};
