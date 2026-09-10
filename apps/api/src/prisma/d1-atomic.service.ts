import crypto from "crypto";
import { Inject, Injectable } from "@nestjs/common";
import type { D1PreparedStatement, D1Result } from "@cloudflare/workers-types";
import { PrismaService } from "./prisma.service";

type OptionalValue = string | number | null;

export function isD1UniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint failed/i.test(error.message);
}

export type AtomicProfileInput = {
  customerId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  defaultDistrict: string | null;
  defaultDeliveryArea: string | null;
  defaultAddress: string | null;
  marketingConsent: boolean;
  personalizationConsent: boolean;
  preferredCategories: string[];
  preferredTags: string[];
  preferredLanguages: string[];
};

export type AtomicOrderInput = {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingAddress: string;
  district: string;
  deliveryArea: string;
  subtotal: number;
  discountTotal: number;
  deliveryCharge: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string | null;
  notes: string | null;
  items: Array<{
    id: string;
    bookId: string;
    bookTitleSnapshot: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
};

export type AtomicCustomerCreateInput = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordLoginEnabled: boolean;
  emailVerifiedAt: Date | null;
};

function dateValue(value: Date): string {
  return value.toISOString().replace("Z", "+00:00");
}

function changes(result: D1Result | undefined): number {
  return Number(result?.meta.changes ?? 0);
}

/**
 * The only native-SQL boundary in the API. D1 batch() is used solely for
 * multi-write invariants that Prisma's D1 adapter cannot make atomic.
 */
@Injectable()
export class D1AtomicService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  newId(): string {
    return crypto.randomUUID();
  }

  private statement(sql: string, values: OptionalValue[]): D1PreparedStatement {
    return this.prisma.binding.prepare(sql).bind(...values);
  }

  private async batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
    return this.prisma.binding.batch(statements);
  }

  async resetPassword(input: {
    resetId: string;
    expectedTokenHash: string;
    customerId: string;
    email: string;
    passwordHash: string;
    verifyEmail: boolean;
  }): Promise<boolean> {
    const now = dateValue(new Date());
    const claim = `consumed:${crypto.randomUUID()}`;
    const results = await this.batch([
      this.statement(
        `UPDATE "PasswordResetToken"
         SET "consumedAt" = ?, "tokenHash" = ?, "updatedAt" = ?
         WHERE "id" = ? AND "tokenHash" = ? AND "consumedAt" IS NULL
           AND "expiresAt" > ? AND "email" = ?
           AND EXISTS (SELECT 1 FROM "Customer" WHERE "id" = ? AND "email" = ?
             AND "isActive" = 1 AND "passwordLoginEnabled" = 1)`,
        [now, claim, now, input.resetId, input.expectedTokenHash, now, input.email, input.customerId, input.email],
      ),
      this.statement(
        `UPDATE "Customer"
         SET "passwordHash" = ?,
             "emailVerifiedAt" = CASE WHEN ? = 1 THEN COALESCE("emailVerifiedAt", ?) ELSE "emailVerifiedAt" END,
             "updatedAt" = ?
         WHERE "id" = ? AND "email" = ? AND "isActive" = 1 AND "passwordLoginEnabled" = 1 AND EXISTS (
           SELECT 1 FROM "PasswordResetToken"
           WHERE "id" = ? AND "tokenHash" = ? AND "consumedAt" = ?
         )`,
        [
          input.passwordHash,
          input.verifyEmail ? 1 : 0,
          now,
          now,
          input.customerId,
          input.email,
          input.resetId,
          claim,
          now,
        ],
      ),
      this.statement(
        `DELETE FROM "CustomerSession"
         WHERE "customerId" = ? AND EXISTS (
           SELECT 1 FROM "PasswordResetToken"
           WHERE "id" = ? AND "tokenHash" = ? AND "consumedAt" = ?
         )`,
        [input.customerId, input.resetId, claim, now],
      ),
    ]);
    return changes(results[0]) === 1 && changes(results[1]) === 1;
  }

  async consumeSignupOtp(input: {
    otpId: string;
    expectedOtpHash: string;
    customerId: string;
    email: string;
  }): Promise<boolean> {
    const now = dateValue(new Date());
    const claim = `consumed:${crypto.randomUUID()}`;
    const results = await this.batch([
      this.conditionalOtpClaim(input.otpId, input.expectedOtpHash, claim, now, input.customerId, input.email),
      this.statement(
        `UPDATE "Customer" SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", ?), "updatedAt" = ?
         WHERE "id" = ? AND EXISTS (
           SELECT 1 FROM "OtpVerification" WHERE "id" = ? AND "otpHash" = ? AND "consumedAt" = ?
         )`,
        [now, now, input.customerId, input.otpId, claim, now],
      ),
    ]);
    return changes(results[0]) === 1 && changes(results[1]) === 1;
  }

  async consumeOtpAndIssueReset(input: {
    otpId: string;
    expectedOtpHash: string;
    email: string;
    customerId: string;
    resetId: string;
    resetTokenHash: string;
    resetExpiresAt: Date;
  }): Promise<boolean> {
    const now = dateValue(new Date());
    const claim = `consumed:${crypto.randomUUID()}`;
    const results = await this.batch([
      this.conditionalOtpClaim(input.otpId, input.expectedOtpHash, claim, now, input.customerId, input.email),
      this.statement(
        `INSERT INTO "PasswordResetToken"
           ("id", "email", "tokenHash", "expiresAt", "consumedAt", "createdAt", "updatedAt")
         SELECT ?, ?, ?, ?, NULL, ?, ?
         FROM "OtpVerification"
         WHERE "id" = ? AND "otpHash" = ? AND "consumedAt" = ?
         ON CONFLICT("email") DO UPDATE SET
           "tokenHash" = excluded."tokenHash", "expiresAt" = excluded."expiresAt",
           "consumedAt" = NULL, "updatedAt" = excluded."updatedAt"`,
        [
          input.resetId,
          input.email,
          input.resetTokenHash,
          dateValue(input.resetExpiresAt),
          now,
          now,
          input.otpId,
          claim,
          now,
        ],
      ),
    ]);
    return changes(results[0]) === 1 && changes(results[1]) === 1;
  }

  private conditionalOtpClaim(
    otpId: string,
    expectedOtpHash: string,
    claim: string,
    now: string,
    customerId: string,
    customerEmail: string,
  ): D1PreparedStatement {
    return this.statement(
      `UPDATE "OtpVerification"
       SET "consumedAt" = ?, "otpHash" = ?, "updatedAt" = ?
       WHERE "id" = ? AND "otpHash" = ? AND "consumedAt" IS NULL
         AND "expiresAt" > ? AND "attempts" < 5
         AND EXISTS (SELECT 1 FROM "Customer" WHERE "id" = ? AND "email" = ?)`,
      [now, claim, now, otpId, expectedOtpHash, now, customerId, customerEmail],
    );
  }

  async upsertSignupCustomer(
    customer: AtomicCustomerCreateInput,
    existingCustomerId?: string,
  ): Promise<void> {
    const now = dateValue(new Date());
    const customerId = existingCustomerId ?? customer.id;
    const customerStatement = existingCustomerId
      ? this.statement(
          `UPDATE "Customer" SET "name" = ?, "passwordHash" = ?,
             "passwordLoginEnabled" = 1, "updatedAt" = ? WHERE "id" = ?`,
          [customer.name, customer.passwordHash, now, customerId],
        )
      : this.statement(
          `INSERT INTO "Customer"
           ("id", "name", "email", "phone", "passwordHash", "passwordLoginEnabled",
            "emailVerifiedAt", "isActive", "lastLoginAt", "createdAt", "updatedAt")
           VALUES (?, ?, ?, NULL, ?, 1, NULL, 1, NULL, ?, ?)`,
          [customerId, customer.name, customer.email, customer.passwordHash, now, now],
        );
    if (existingCustomerId) {
      await this.batch([
        customerStatement,
        this.statement(
          `INSERT INTO "CustomerProfile"
           ("id", "customerId", "displayName", "phone", "email", "defaultDistrict",
            "defaultDeliveryArea", "defaultAddress", "avatarUrl", "marketingConsent",
            "personalizationConsent", "createdAt", "updatedAt")
           VALUES (?, ?, ?, NULL, ?, NULL, NULL, NULL, NULL, 0, 0, ?, ?)
           ON CONFLICT("customerId") DO UPDATE SET
             "displayName" = excluded."displayName", "email" = excluded."email",
             "updatedAt" = excluded."updatedAt"`,
          [this.newId(), customerId, customer.name, customer.email, now, now],
        ),
        this.statement(
          `INSERT INTO "CustomerPreference"
           ("id", "customerId", "preferredCategories", "preferredTags", "preferredLanguages", "createdAt", "updatedAt")
           VALUES (?, ?, '[]', '[]', '[]', ?, ?)
           ON CONFLICT("customerId") DO NOTHING`,
          [this.newId(), customerId, now, now],
        ),
      ]);
      return;
    }
    await this.batch([
      customerStatement,
      this.profileUpsertStatement(customerId, customer.name, customer.email, null, null, null, null, false, false, now),
      this.preferenceUpsertStatement(customerId, [], [], [], now),
    ]);
  }

  async updateProfile(input: AtomicProfileInput): Promise<void> {
    const now = dateValue(new Date());
    await this.batch([
      this.statement(
        `UPDATE "Customer" SET "name" = ?, "email" = ?, "phone" = ?, "updatedAt" = ?
         WHERE "id" = ?`,
        [input.displayName, input.email, input.phone, now, input.customerId],
      ),
      this.profileUpsertStatement(
        input.customerId,
        input.displayName,
        input.email,
        input.phone,
        input.defaultDistrict,
        input.defaultDeliveryArea,
        input.defaultAddress,
        input.marketingConsent,
        input.personalizationConsent,
        now,
      ),
      this.preferenceUpsertStatement(
        input.customerId,
        input.preferredCategories,
        input.preferredTags,
        input.preferredLanguages,
        now,
      ),
    ]);
  }

  private profileUpsertStatement(
    customerId: string,
    displayName: string,
    email: string | null,
    phone: string | null,
    defaultDistrict: string | null,
    defaultDeliveryArea: string | null,
    defaultAddress: string | null,
    marketingConsent: boolean,
    personalizationConsent: boolean,
    now: string,
  ): D1PreparedStatement {
    return this.statement(
      `INSERT INTO "CustomerProfile"
       ("id", "customerId", "displayName", "phone", "email", "defaultDistrict",
        "defaultDeliveryArea", "defaultAddress", "avatarUrl", "marketingConsent",
        "personalizationConsent", "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
       ON CONFLICT("customerId") DO UPDATE SET
        "displayName" = excluded."displayName", "phone" = excluded."phone",
        "email" = excluded."email", "defaultDistrict" = COALESCE(excluded."defaultDistrict", "CustomerProfile"."defaultDistrict"),
        "defaultDeliveryArea" = COALESCE(excluded."defaultDeliveryArea", "CustomerProfile"."defaultDeliveryArea"),
        "defaultAddress" = COALESCE(excluded."defaultAddress", "CustomerProfile"."defaultAddress"),
        "marketingConsent" = excluded."marketingConsent",
        "personalizationConsent" = excluded."personalizationConsent", "updatedAt" = excluded."updatedAt"`,
      [
        this.newId(), customerId, displayName, phone, email, defaultDistrict,
        defaultDeliveryArea, defaultAddress, marketingConsent ? 1 : 0,
        personalizationConsent ? 1 : 0, now, now,
      ],
    );
  }

  private preferenceUpsertStatement(
    customerId: string,
    categories: string[],
    tags: string[],
    languages: string[],
    now: string,
  ): D1PreparedStatement {
    return this.statement(
      `INSERT INTO "CustomerPreference"
       ("id", "customerId", "preferredCategories", "preferredTags", "preferredLanguages", "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT("customerId") DO UPDATE SET
        "preferredCategories" = excluded."preferredCategories",
        "preferredTags" = excluded."preferredTags",
        "preferredLanguages" = excluded."preferredLanguages", "updatedAt" = excluded."updatedAt"`,
      [this.newId(), customerId, JSON.stringify(categories), JSON.stringify(tags), JSON.stringify(languages), now, now],
    );
  }

  async createOrder(input: AtomicOrderInput): Promise<void> {
    const now = dateValue(new Date());
    const statements = [
      this.statement(
        `INSERT INTO "Order"
         ("id", "orderNumber", "customerId", "customerName", "customerPhone", "customerEmail",
          "shippingAddress", "district", "deliveryArea", "subtotal", "discountTotal", "deliveryCharge",
          "grandTotal", "paymentMethod", "paymentStatus", "orderStatus", "transactionId", "courierName",
          "trackingNumber", "notes", "adminNote", "stockReduced", "createdAt", "updatedAt")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NULL, NULL, ?, NULL, 0, ?, ?)`,
        [
          input.id, input.orderNumber, input.customerId, input.customerName, input.customerPhone,
          input.customerEmail, input.shippingAddress, input.district, input.deliveryArea, input.subtotal,
          input.discountTotal, input.deliveryCharge, input.grandTotal, input.paymentMethod,
          input.paymentStatus, input.transactionId, input.notes, now, now,
        ],
      ),
      ...input.items.map((item) =>
        this.statement(
          `INSERT INTO "OrderItem"
           ("id", "orderId", "bookId", "bookTitleSnapshot", "quantity", "unitPrice", "totalPrice")
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [item.id, input.id, item.bookId, item.bookTitleSnapshot, item.quantity, item.unitPrice, item.totalPrice],
        ),
      ),
    ];
    await this.batch(statements);
  }

  async linkGoogleCustomer(input: {
    providerId: string;
    customerId: string;
    providerUserId: string;
    providerEmail: string;
  }): Promise<void> {
    const now = dateValue(new Date());
    await this.batch([
      this.providerInsertStatement(input, now),
      this.statement(
        `UPDATE "Customer" SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", ?), "updatedAt" = ?
         WHERE "id" = ?`,
        [now, now, input.customerId],
      ),
    ]);
  }

  async createGoogleCustomer(input: {
    customer: AtomicCustomerCreateInput;
    displayName: string;
    providerId: string;
    providerUserId: string;
    providerEmail: string;
  }): Promise<void> {
    const now = dateValue(new Date());
    await this.batch([
      this.statement(
        `INSERT INTO "Customer"
         ("id", "name", "email", "phone", "passwordHash", "passwordLoginEnabled",
          "emailVerifiedAt", "isActive", "lastLoginAt", "createdAt", "updatedAt")
         VALUES (?, ?, ?, NULL, ?, 0, ?, 1, NULL, ?, ?)`,
        [input.customer.id, input.customer.name, input.customer.email, input.customer.passwordHash, now, now, now],
      ),
      this.profileUpsertStatement(input.customer.id, input.displayName, input.customer.email, null, null, null, null, false, false, now),
      this.preferenceUpsertStatement(input.customer.id, [], [], [], now),
      this.providerInsertStatement(
        {
          providerId: input.providerId,
          customerId: input.customer.id,
          providerUserId: input.providerUserId,
          providerEmail: input.providerEmail,
        },
        now,
      ),
    ]);
  }

  private providerInsertStatement(
    input: { providerId: string; customerId: string; providerUserId: string; providerEmail: string },
    now: string,
  ): D1PreparedStatement {
    return this.statement(
      `INSERT INTO "CustomerAuthProvider"
       ("id", "customerId", "provider", "providerUserId", "providerEmail", "createdAt", "updatedAt")
       VALUES (?, ?, 'google', ?, ?, ?, ?)`,
      [input.providerId, input.customerId, input.providerUserId, input.providerEmail, now, now],
    );
  }
}
