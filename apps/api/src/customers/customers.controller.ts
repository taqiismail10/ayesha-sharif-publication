import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Put,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CustomerGuard } from "../common/guards/customer.guard";
import { CurrentCustomer } from "../common/decorators/current-customer.decorator";
import type { CurrentCustomer as CurrentCustomerType } from "../customer-auth/customer-auth.service";
import {
  customerPasswordSchema,
  customerProfileSchema,
  type CustomerPasswordInput,
  type CustomerProfileInput,
} from "../common/contracts/customer.schemas";
import { CustomersService } from "./customers.service";

@Controller("customers/me")
@UseGuards(CustomerGuard)
export class CustomersController {
  constructor(
    @Inject(CustomersService) private readonly customers: CustomersService,
  ) {}

  /** PUT /customers/me/profile */
  @Put("profile")
  updateProfile(
    @CurrentCustomer() customer: CurrentCustomerType,
    @Body() body: unknown,
  ) {
    const parsed = customerProfileSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !(field in fieldErrors)) {
          fieldErrors[field] = issue.message;
        }
      }
      throw new BadRequestException({
        message: parsed.error.issues[0]?.message || "Invalid profile details.",
        fieldErrors,
      });
    }
    return this.customers.updateProfile(
      customer,
      parsed.data as CustomerProfileInput,
    );
  }

  /** PUT /customers/me/password */
  /** Strict limit — current-password verification is brute-forceable. */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Put("password")
  changePassword(
    @CurrentCustomer() customer: CurrentCustomerType,
    @Body() body: unknown,
  ) {
    const parsed = customerPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !(field in fieldErrors)) {
          fieldErrors[field] = issue.message;
        }
      }
      throw new BadRequestException({
        message: parsed.error.issues[0]?.message || "Invalid password details.",
        fieldErrors,
      });
    }
    return this.customers.changePassword(
      customer,
      parsed.data as CustomerPasswordInput,
    );
  }
}
