import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { AdminUploadsController } from "./admin-uploads.controller";
import { UploadsService } from "./uploads.service";

@Module({
  imports: [AdminModule],
  controllers: [AdminUploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
