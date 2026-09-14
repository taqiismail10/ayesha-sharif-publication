import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AdminAuthService } from "./admin-auth.service";

export type RequestWithAdmin = Request & { admin: NonNullable<Awaited<ReturnType<AdminAuthService["resolveAdmin"]>>> };

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@Inject(AdminAuthService) private readonly auth: AdminAuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithAdmin>();
    const admin = await this.auth.resolveAdmin(request);
    if (!admin) throw new UnauthorizedException("Admin authentication required.");
    request.admin = admin;
    return true;
  }
}
