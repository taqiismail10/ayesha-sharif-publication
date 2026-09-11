import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AdminRole } from "../generated/prisma/enums";
import { AdminPermissionService } from "./admin-permission.service";
import { ADMIN_ROLES_KEY } from "./admin-roles.decorator";
import type { RequestWithAdmin } from "./admin.guard";

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: AdminPermissionService,
  ) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<AdminRole[]>(ADMIN_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const request = context.switchToHttp().getRequest<RequestWithAdmin>();
    this.permissions.assertAnyRole(request.admin.role, roles);
    return true;
  }
}
