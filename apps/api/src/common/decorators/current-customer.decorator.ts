import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { RequestWithCustomer } from "../guards/customer.guard";

/** Injects the customer attached by CustomerGuard. Use only behind the guard. */
export const CurrentCustomer = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithCustomer>();
    return request.customer;
  },
);
