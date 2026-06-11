import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";
import { CustomerAuthModule } from "./customer-auth/customer-auth.module";
import { CustomersModule } from "./customers/customers.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    // .env is loaded from apps/api/.env. Variables are NOT renamed yet —
    // the API reuses DATABASE_URL exactly as the Next.js app does (Phase 0 rule).
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    PrismaModule,
    HealthModule,
    CustomerAuthModule,
    CustomersModule,
  ],
  providers: [
    // Maps Prisma known errors to proper HTTP codes (P2002→409, P2025→404).
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
