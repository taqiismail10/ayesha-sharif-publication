import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";
import { CustomerAuthModule } from "./customer-auth/customer-auth.module";
import { CustomersModule } from "./customers/customers.module";
import { HealthModule } from "./health/health.module";
import { OrdersModule } from "./orders/orders.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RecommendationsModule } from "./recommendations/recommendations.module";

@Module({
  imports: [
    // .env is loaded from apps/api/.env. Variables are NOT renamed yet —
    // the API reuses DATABASE_URL exactly as the Next.js app does (Phase 0 rule).
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    // Phase 2 security verification: global rate limiting baseline.
    // 100 requests/min per IP; auth endpoints carry stricter @Throttle
    // overrides in their controllers. In-memory store — per-instance.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    HealthModule,
    CustomerAuthModule,
    CustomersModule,
    OrdersModule,
    RecommendationsModule,
  ],
  providers: [
    // Maps Prisma known errors to proper HTTP codes (P2002→409, P2025→404).
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    // Rate limiting on every route (overridable per-handler with @Throttle).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
