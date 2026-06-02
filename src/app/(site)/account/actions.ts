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
  customerRegisterSchema,
  normalizeBangladeshPhone,
  normalizeEmail
} from "@/lib/validators";

export type CustomerActionState = {
  error?: string;
  success?: string;
};

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
  _previousState: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  if (!hasUsableDatabaseUrl()) return databaseUnavailableState();

  const parsed = customerRegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid account details." };
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const customer = await prisma.customer.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        passwordHash,
        profile: {
          create: {
            displayName: parsed.data.name,
            email: parsed.data.email,
            phone: parsed.data.phone
          }
        },
        preferences: {
          create: {}
        }
      }
    });

    await createCustomerSession(customer);
  } catch (caught) {
    if (
      caught instanceof Prisma.PrismaClientKnownRequestError &&
      caught.code === "P2002"
    ) {
      return { error: customerConflictMessage() };
    }
    return { error: "Could not create your account. Please try again." };
  }

  redirect("/account/profile");
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
    return { error: parsed.error.issues[0]?.message || "Invalid login details." };
  }

  const identifier = parsed.data.identifier;
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
    ? await verifyPassword(parsed.data.password, customer.passwordHash)
    : false;

  if (!customer?.isActive || !validPassword) {
    return { error: "Invalid email/phone or password." };
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { lastLoginAt: new Date() }
  });
  await createCustomerSession(customer);

  redirect(
    isSafeAccountRedirect(parsed.data.redirectTo)
      ? parsed.data.redirectTo
      : "/account/profile"
  );
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
    return { error: parsed.error.issues[0]?.message || "Invalid profile details." };
  }

  try {
    await prisma.$transaction([
      prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: parsed.data.displayName,
          email: parsed.data.email,
          phone: parsed.data.phone
        }
      }),
      prisma.customerProfile.upsert({
        where: { customerId: customer.id },
        update: {
          displayName: parsed.data.displayName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          defaultDistrict: optionalString(formData.get("defaultDistrict")),
          defaultDeliveryArea: optionalString(formData.get("defaultDeliveryArea")),
          defaultAddress: optionalString(formData.get("defaultAddress")),
          marketingConsent: !!parsed.data.marketingConsent,
          personalizationConsent: !!parsed.data.personalizationConsent
        },
        create: {
          customerId: customer.id,
          displayName: parsed.data.displayName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          defaultDistrict: optionalString(formData.get("defaultDistrict")),
          defaultDeliveryArea: optionalString(formData.get("defaultDeliveryArea")),
          defaultAddress: optionalString(formData.get("defaultAddress")),
          marketingConsent: !!parsed.data.marketingConsent,
          personalizationConsent: !!parsed.data.personalizationConsent
        }
      }),
      prisma.customerPreference.upsert({
        where: { customerId: customer.id },
        update: {
          preferredCategories: parsed.data.preferredCategories || [],
          preferredTags: parsed.data.preferredTags || [],
          preferredLanguages: parsed.data.preferredLanguages || []
        },
        create: {
          customerId: customer.id,
          preferredCategories: parsed.data.preferredCategories || [],
          preferredTags: parsed.data.preferredTags || [],
          preferredLanguages: parsed.data.preferredLanguages || []
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
    return { error: parsed.error.issues[0]?.message || "Invalid password details." };
  }

  const validPassword = await verifyPassword(
    parsed.data.currentPassword,
    customer.passwordHash
  );
  if (!validPassword) {
    return { error: "Current password is incorrect." };
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) }
  });

  return { success: "Password changed." };
}
