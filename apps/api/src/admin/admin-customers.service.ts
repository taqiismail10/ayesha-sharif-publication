import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import { PrismaService } from "../prisma/prisma.service";

const customerQuerySchema = z.object({ q: z.string().max(120, "Search text is too long.").optional() }).strict();

@Injectable()
export class AdminCustomersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(query: unknown) {
    const parsed = customerQuerySchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message || "Invalid customer query.");
    const q = parsed.data.q || undefined;
    return this.prisma.client.customer.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true, savedBooks: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
}
