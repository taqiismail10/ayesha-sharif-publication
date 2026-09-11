import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CurrentCustomer } from "../customer-auth/customer-auth.service";

@Injectable()
export class SavedBooksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(customer: CurrentCustomer) {
    const rows = await this.prisma.client.savedBook.findMany({
      where: { customerId: customer.id },
      select: { bookId: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => row.bookId);
  }

  async save(customer: CurrentCustomer, bookId: string) {
    const book = await this.prisma.client.book.findUnique({
      where: { id: bookId },
      select: { id: true },
    });
    if (!book) throw new NotFoundException("This book could not be found.");

    await this.prisma.client.savedBook.upsert({
      where: { customerId_bookId: { customerId: customer.id, bookId } },
      update: {},
      create: { customerId: customer.id, bookId },
    });
    return { ok: true, saved: true, bookId };
  }

  async remove(customer: CurrentCustomer, bookId: string) {
    await this.prisma.client.savedBook.deleteMany({
      where: { customerId: customer.id, bookId },
    });
    return { ok: true, saved: false, bookId };
  }
}
