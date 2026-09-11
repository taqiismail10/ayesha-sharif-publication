import { ForbiddenException, Injectable } from "@nestjs/common";
import type { AdminRole } from "../generated/prisma/enums";

@Injectable()
export class AdminPermissionService {
  hasAnyRole(role: AdminRole, allowedRoles?: AdminRole[]) {
    return !allowedRoles?.length || allowedRoles.includes(role);
  }

  assertAnyRole(role: AdminRole, allowedRoles?: AdminRole[]) {
    if (!this.hasAnyRole(role, allowedRoles)) {
      throw new ForbiddenException("You do not have permission to perform this action.");
    }
  }
}
