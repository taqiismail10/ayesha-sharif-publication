import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  D1AtomicService,
  isD1UniqueConstraintError,
} from "../prisma/d1-atomic.service";
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
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(D1AtomicService) private readonly atomic: D1AtomicService,
    @Inject(CustomerAuthService) private readonly auth: CustomerAuthService,
  ) {}

  /** PUT /customers/me/profile — contract §6. */
  async updateProfile(customer: CurrentCustomer, input: CustomerProfileInput) {
    try {
      await this.atomic.updateProfile({
        customerId: customer.id,
        displayName: input.displayName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        defaultDistrict: optionalString(input.defaultDistrict) ?? null,
        defaultDeliveryArea: optionalString(input.defaultDeliveryArea) ?? null,
        defaultAddress: optionalString(input.defaultAddress) ?? null,
        marketingConsent: !!input.marketingConsent,
        personalizationConsent: !!input.personalizationConsent,
        preferredCategories: input.preferredCategories || [],
        preferredTags: input.preferredTags || [],
        preferredLanguages: input.preferredLanguages || [],
      });
    } catch (caught) {
      if (
        isD1UniqueConstraintError(caught) ||
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
