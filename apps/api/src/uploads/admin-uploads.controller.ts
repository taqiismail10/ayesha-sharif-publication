import { Body, Controller, Inject, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { AdminGuard } from "../admin/admin.guard";
import { AdminRolesGuard } from "../admin/admin-roles.guard";
import { RequireAdminRoles } from "../admin/admin-roles.decorator";
import { UploadsService, uploadLimits } from "./uploads.service";

type IncomingUpload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Uint8Array;
};

@Controller("admin/uploads")
@UseGuards(AdminGuard, AdminRolesGuard)
@RequireAdminRoles("super_admin", "admin", "editor", "order_manager")
export class AdminUploadsController {
  constructor(@Inject(UploadsService) private readonly uploads: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: { files: 1, fileSize: uploadLimits.multipartBytes } }))
  async upload(@UploadedFile() file: IncomingUpload | undefined, @Body("type") type: unknown, @Req() request: Request) {
    const result = await this.uploads.upload(type, file);
    return {
      ok: true,
      key: result.key,
      url: `${this.origin(request)}/uploads/${result.key}`,
    };
  }

  private origin(request: Request): string {
    const protocol = request.header("x-forwarded-proto")?.split(",")[0]?.trim() || request.protocol;
    const host = request.header("x-forwarded-host") || request.get("host");
    return host ? `${protocol}://${host}` : "";
  }
}
