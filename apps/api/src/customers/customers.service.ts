import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { Prisma } from "../../generated/prisma";
import { PrismaService } from "../prisma/prisma.service";
import {
  CustomerAuthService,
  type CurrentCustomer,
} from "../customer-auth/customer-auth.service";
import type {
  CustomerPasswordInput,
  CustomerProfileInput,
} from "../common/contracts/customer.schemas";

const CONFLICT_MESSAGE =
  "An account with this email or phone may already exist.";

/**
 * Empty/whitespace strings become undefined → Prisma SKIPS the field on
 * update. This preserves the documented quirk (contract §6): users cannot
 * clear a saved default-address field with empty input.
 */
function optionalString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: CustomerAuthService,
  ) {}

  /** PUT /customers/me/profile — contract §6 (3-op transaction preserved). */
  async updateProfile(customer: CurrentCustomer, input: CustomerProfileInput) {
    try {
      await this.prisma.client.$transaction([
        this.prisma.client.customer.update({
          where: { id: customer.id },
          data: {
            name: input.displayName,
            email: input.email,
            phone: input.phone,
          },
        }),
        this.prisma.client.customerProfile.upsert({
          where: { customerId: customer.id },
          update: {
            displayName: input.displayName,
            email: input.email,
            phone: input.phone,
            defaultDistrict: optionalString(input.defaultDistrict),
            defaultDeliveryArea: optionalString(input.defaultDeliveryArea),
            defaultAddress: optionalString(input.defaultAddress),
            marketingConsent: !!input.marketingConsent,
            personalizationConsent: !!input.personalizationConsent,
          },
          create: {
            customerId: customer.id,
            displayName: input.displayName,
            email: input.email,
            phone: input.phone,
            defaultDistrict: optionalString(input.defaultDistrict),
            defaultDeliveryArea: optionalString(input.defaultDeliveryArea),
            defaultAddress: optionalString(input.defaultAddress),
            marketingConsent: !!input.marketingConsent,
            personalizationConsent: !!input.personalizationConsent,
          },
        }),
        this.prisma.client.customerPreference.upsert({
          where: { customerId: customer.id },
          update: {
            preferredCategories: input.preferredCategories || [],
            preferredTags: input.preferredTags || [],
            preferredLanguages: input.preferredLanguages || [],
          },
          create: {
            customerId: customer.id,
            preferredCategories: input.preferredCategories || [],
            preferredTags: input.preferredTags || [],
            preferredLanguages: input.preferredLanguages || [],
          },
        }),
      ]);
    } catch (caught) {
      if (
        caught instanceof Prisma.PrismaClientKnownRequestError &&
        caught.code === "P2002"
      ) {
        throw new ConflictException(CONFLICT_MESSAGE);
      }
      throw new BadRequestException(
        "Could not update your profile. Please try again.",
      );
    }

    return { ok: true, message: "Profile saved." };
  }

  /** PUT /customers/me/password — contract §7. */
  async changePassword(
    customer: CurrentCustomer,
    input: CustomerPasswordInput,
  ) {
    const validPassword = await this.auth.verifyPassword(
      input.currentPassword,
      customer.passwordHash,
    );
    if (!validPassword) {
      throw new BadRequestException("Current password is incorrect.");
    }

    await this.prisma.client.customer.update({
      where: { id: customer.id },
      data: { passwordHash: await this.auth.hashPassword(input.newPassword) },
    });

    // Parity note: existing sessions intentionally remain valid (contract §7).
    return { ok: true, message: "Password changed." };
  }
}
