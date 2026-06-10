import { Controller, Get, Header } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * GET /health — mirrors the shape of the Next.js /api/health route, but with
 * a REAL database ping (the old route always reported "not_checked").
 */
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Header("Cache-Control", "private, no-store, max-age=0")
  async check() {
    let database: "ok" | "unreachable" | "not_configured";
    if (!this.prisma.isAvailable()) {
      database = "not_configured";
    } else {
      database = (await this.prisma.ping()) ? "ok" : "unreachable";
    }

    return {
      status: "ok",
      service: "asp-api",
      environment: process.env.NODE_ENV || "unknown",
      database,
      checkedAt: new Date().toISOString(),
    };
  }
}
