import { Body, Controller, Put, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CustomerGuard } from "../common/guards/customer.guard";
import { CurrentCustomer } from "../common/decorators/current-customer.decorator";
import type { CurrentCustomer as CurrentCustomerType } from "../customer-auth/customer-auth.service";
import { parseOrThrow } from "../common/validation/zod";
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
  constructor(private readonly customers: CustomersService) {}

  /** PUT /customers/me/profile */
  @Put("profile")
  updateProfile(
    @CurrentCustomer() customer: CurrentCustomerType,
    @Body() body: unknown,
  ) {
    const input = parseOrThrow(
      customerProfileSchema,
      body,
      "Invalid profile details.",
    ) as CustomerProfileInput;
    return this.customers.updateProfile(customer, input);
  }

  /** PUT /customers/me/password */
  /** Strict limit — current-password verification is brute-forceable. */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Put("password")
  changePassword(
    @CurrentCustomer() customer: CurrentCustomerType,
    @Body() body: unknown,
  ) {
    const input = parseOrThrow(
      customerPasswordSchema,
      body,
      "Invalid password details.",
    ) as CustomerPasswordInput;
    return this.customers.changePassword(customer, input);
  }
}
