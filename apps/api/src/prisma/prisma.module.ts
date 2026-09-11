import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { D1AtomicService } from "./d1-atomic.service";

/** Global so feature modules (Phase 1+) inject PrismaService without imports. */
@Global()
@Module({
  providers: [PrismaService, D1AtomicService],
  exports: [PrismaService, D1AtomicService],
})
export class PrismaModule {}
