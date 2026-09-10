import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import {
  CustomerAuthService,
  type CurrentCustomer,
} from "../../customer-auth/customer-auth.service";

/** Request augmented by CustomerGuard. */
export interface RequestWithCustomer extends Request {
  customer: CurrentCustomer;
}

/**
 * Requires a valid customer session cookie; attaches the loaded customer
 * (incl. profile + preferences) to the request. 401 when absent/invalid —
 * the frontend owns the redirect-to-login behavior (old requireCustomer
 * redirected server-side; that concern stays in Next).
 */
@Injectable()
export class CustomerGuard implements CanActivate {
  constructor(
    @Inject(CustomerAuthService) private readonly auth: CustomerAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCustomer>();
    const customer = await this.auth.resolveCustomer(request);
    if (!customer) {
      throw new UnauthorizedException("Sign in to continue.");
    }
    request.customer = customer;
    return true;
  }
}
