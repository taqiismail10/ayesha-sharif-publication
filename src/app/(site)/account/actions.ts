"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import {
  clearCustomerSession,
  createCustomerSession,
  isSafeAccountRedirect,
  requireCustomer
} from "@/lib/customer-auth";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasUsableDatabaseUrl } from "@/lib/env";
import {
  customerLoginSchema,
  customerPasswordSchema,
  customerProfileSchema,
  normalizeBangladeshPhone,
  normalizeEmail
} from "@/lib/validators";

export type CustomerActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

function fieldErrorsFromZodIssues(
  issues: { path: (string | number)[]; message: string }[]
) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) {
      out[key] = issue.message;
    }
  }
  return out;
}

function booleanFromForm(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function optionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function customerConflictMessage() {
  return "An account with this email or phone may already exist.";
}

function databaseUnavailableState() {
  return {
    error:
      "Customer accounts need PostgreSQL. The storefront can still be browsed as a guest."
  };
}

// TODO: Add per-IP and per-identifier rate limiting once the deployment layer
// exposes a stable rate-limit store. Login failures intentionally stay generic.
export async function registerCustomerAction(
  previousState: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  void previousState;
  void formData;
  return {
    error:
      "Email verification is required. Start again from the registration page."
  };
}

export async function loginCustomerAction(
  _previousState: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  if (!hasUsableDatabaseUrl()) return databaseUnavailableState();

  const parsed = customerLoginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid login details.",
      fieldErrors: fieldErrorsFromZodIssues(parsed.error.issues)
    };
  }
  const input = parsed.data as {
    identifier: string;
    password: string;
    redirectTo?: string;
  };

  const identifier = input.identifier;
  const email = identifier.includes("@") ? normalizeEmail(identifier) : undefined;
  const normalizedPhone = email ? undefined : normalizeBangladeshPhone(identifier);
  const phone =
    normalizedPhone && /^01[3-9]\d{8}$/.test(normalizedPhone)
      ? normalizedPhone
      : undefined;
  const lookup = [email ? { email } : null, phone ? { phone } : null].filter(
    Boolean
  ) as Array<{ email: string } | { phone: string }>;
  if (!lookup.length) {
    return { error: "Invalid email/phone or password." };
  }

  const customer = await prisma.customer.findFirst({
    where: { OR: lookup }
  });

  const validPassword = customer
    ? await verifyPassword(input.password, customer.passwordHash)
    : false;

  if (
    !customer?.isActive ||
    !customer.passwordLoginEnabled ||
    !validPassword
  ) {
    return { error: "Invalid email/phone or password." };
  }
  if (customer.email && !customer.emailVerifiedAt) {
    return { error: "Verify your email before signing in." };
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { lastLoginAt: new Date() }
  });
  await createCustomerSession(customer);

  const redirectTo =
    input.redirectTo && isSafeAccountRedirect(input.redirectTo)
      ? input.redirectTo
      : "/account";
  redirect(redirectTo);
}

export async function logoutCustomerAction() {
  await clearCustomerSession();
  redirect("/");
}

export async function updateCustomerProfileAction(
  _previousState: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const customer = await requireCustomer();
  const parsed = customerProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    defaultDistrict: formData.get("defaultDistrict"),
    defaultDeliveryArea: formData.get("defaultDeliveryArea"),
    defaultAddress: formData.get("defaultAddress"),
    marketingConsent: booleanFromForm(formData, "marketingConsent"),
    personalizationConsent: booleanFromForm(formData, "personalizationConsent"),
    preferredCategories: formData.getAll("preferredCategories").map(String),
    preferredTags: formData.getAll("preferredTags").map(String),
    preferredLanguages: formData.getAll("preferredLanguages").map(String)
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid profile details.",
      fieldErrors: fieldErrorsFromZodIssues(parsed.error.issues)
    };
  }
  const input = parsed.data as {
    displayName: string;
    email?: string;
    phone?: string;
    marketingConsent?: boolean;
    personalizationConsent?: boolean;
    preferredCategories?: string[];
    preferredTags?: string[];
    preferredLanguages?: string[];
  };

  try {
    await prisma.$transaction([
      prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: input.displayName,
          email: input.email,
          phone: input.phone
        }
      }),
      prisma.customerProfile.upsert({
        where: { customerId: customer.id },
        update: {
          displayName: input.displayName,
          email: input.email,
          phone: input.phone,
          defaultDistrict: optionalString(formData.get("defaultDistrict")),
          defaultDeliveryArea: optionalString(formData.get("defaultDeliveryArea")),
          defaultAddress: optionalString(formData.get("defaultAddress")),
          marketingConsent: !!input.marketingConsent,
          personalizationConsent: !!input.personalizationConsent
        },
        create: {
          customerId: customer.id,
          displayName: input.displayName,
          email: input.email,
          phone: input.phone,
          defaultDistrict: optionalString(formData.get("defaultDistrict")),
          defaultDeliveryArea: optionalString(formData.get("defaultDeliveryArea")),
          defaultAddress: optionalString(formData.get("defaultAddress")),
          marketingConsent: !!input.marketingConsent,
          personalizationConsent: !!input.personalizationConsent
        }
      }),
      prisma.customerPreference.upsert({
        where: { customerId: customer.id },
        update: {
          preferredCategories: input.preferredCategories || [],
          preferredTags: input.preferredTags || [],
          preferredLanguages: input.preferredLanguages || []
        },
        create: {
          customerId: customer.id,
          preferredCategories: input.preferredCategories || [],
          preferredTags: input.preferredTags || [],
          preferredLanguages: input.preferredLanguages || []
        }
      })
    ]);
  } catch (caught) {
    if (
      caught instanceof Prisma.PrismaClientKnownRequestError &&
      caught.code === "P2002"
    ) {
      return { error: customerConflictMessage() };
    }
    return { error: "Could not update your profile. Please try again." };
  }

  revalidatePath("/account");
  revalidatePath("/account/settings");
  revalidatePath("/account/profile");
  return { success: "Profile saved." };
}

export async function changeCustomerPasswordAction(
  _previousState: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const customer = await requireCustomer();
  const parsed = customerPasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid password details.",
      fieldErrors: fieldErrorsFromZodIssues(parsed.error.issues)
    };
  }
  const input = parsed.data as {
    currentPassword: string;
    newPassword: string;
  };

  const validPassword = await verifyPassword(
    input.currentPassword,
    customer.passwordHash
  );
  if (!validPassword) {
    return { error: "Current password is incorrect." };
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { passwordHash: await hashPassword(input.newPassword) }
  });

  return { success: "Password changed." };
}
