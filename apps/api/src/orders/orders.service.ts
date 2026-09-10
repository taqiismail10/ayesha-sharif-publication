import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { D1AtomicService } from "../prisma/d1-atomic.service";
import { RecommendationEventsService, cleanAnonymousRecommendationId } from "../recommendations/recommendation-events.service";
import type { CurrentCustomer } from "../customer-auth/customer-auth.service";
import type { CheckoutInput } from "../common/contracts/checkout.schema";
import {
  deliveryAreas,
  deliveryChargeFor,
  type DeliveryAreaOption,
} from "../common/contracts/delivery";

/** Statuses a book may be ordered in — same as the old route. */
const purchasableStatuses = ["published", "pre_order"] as const;

/**
 * Decimal→number conversion — ported from src/lib/format.ts toNumber().
 * The old route did plain JS float math on these numbers; we replicate it
 * exactly so stored totals match what the old backend would have written.
 */
function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

/** Order number — ported from src/lib/order-utils.ts: ASP-YYMMDD-NNNN. */
function createOrderNumber() {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ASP-${stamp}-${random}`;
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(D1AtomicService) private readonly atomic: D1AtomicService,
    @Inject(RecommendationEventsService)
    private readonly events: RecommendationEventsService,
  ) {}

  /**
   * Delivery options — ported from src/lib/settings.ts: constants overridden
   * by the admin-editable SiteSetting "delivery_charges"; constants on error.
   * (No unstable_cache here — that was a Next-only mechanism.)
   */
  private async getDeliveryOptions(): Promise<DeliveryAreaOption[]> {
    try {
      const setting = await this.prisma.client.siteSetting.findUnique({
        where: { key: "delivery_charges" },
      });
      const value = (setting?.value || {}) as Record<string, number>;
      return deliveryAreas.map((area) => ({
        ...area,
        charge: Number(value[area.value] ?? area.charge),
      }));
    } catch {
      return deliveryAreas;
    }
  }

  /** Up to 5 attempts, like the old route. */
  private async uniqueOrderNumber(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderNumber = createOrderNumber();
      const exists = await this.prisma.client.order.findUnique({
        where: { orderNumber },
      });
      if (!exists) return orderNumber;
    }
    throw new Error("Could not create a unique order number.");
  }

  /**
   * Creates an order — guest or authenticated (customer attached when a valid
   * session cookie was presented). Behavior contract §8–§10:
   *  - stock validated but NOT reduced (admin confirmation reduces stock)
   *  - subtotal from regularPrice, sale totals from salePrice
   *  - paymentStatus: unpaid (COD) / pending (manual methods)
   *  - Order + OrderItems use one native D1 transactional batch
   *  - fire-and-forget purchase events per item
   */
  async createOrder(
    input: CheckoutInput,
    customer: CurrentCustomer | null,
  ): Promise<{ orderNumber: string }> {
    const db = this.prisma.client;

    const bookIds = input.items.map((item) => item.bookId);
    const books = await db.book.findMany({ where: { id: { in: bookIds } } });
    const bookById = new Map(books.map((book) => [book.id, book]));

    const orderItems = input.items.map((item) => {
      const book = bookById.get(item.bookId);
      if (!book) {
        throw new Error("One or more books are no longer available.");
      }
      if (
        !(purchasableStatuses as readonly string[]).includes(book.status) ||
        book.stockQuantity < item.quantity
      ) {
        throw new Error(
          `${book.title} is not available in the requested quantity.`,
        );
      }
      const regularPrice = toNumber(book.regularPrice);
      const unitPrice = toNumber(book.salePrice);
      return {
        book,
        quantity: item.quantity,
        regularTotal: regularPrice * item.quantity,
        totalPrice: unitPrice * item.quantity,
        unitPrice,
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.regularTotal, 0);
    const saleSubtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountTotal = Math.max(subtotal - saleSubtotal, 0);
    const deliveryCharge = deliveryChargeFor(
      input.deliveryArea,
      await this.getDeliveryOptions(),
    );
    const grandTotal = saleSubtotal + deliveryCharge;
    const orderNumber = await this.uniqueOrderNumber();

    // Stock is not touched here; the later admin confirmation flow owns it.
    try {
      await this.atomic.createOrder({
        id: this.atomic.newId(),
        orderNumber,
        customerId: customer?.id ?? null,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail ?? null,
        shippingAddress: input.shippingAddress,
        district: input.district,
        deliveryArea: input.deliveryArea,
        subtotal,
        discountTotal,
        deliveryCharge,
        grandTotal,
        paymentMethod: input.paymentMethod,
        paymentStatus:
          input.paymentMethod === "cash_on_delivery" ? "unpaid" : "pending",
        transactionId: input.transactionId ?? null,
        notes: input.notes ?? null,
        items: orderItems.map((item) => ({
          id: this.atomic.newId(),
          bookId: item.book.id,
          bookTitleSnapshot: item.book.title,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      });
    } catch {
      throw new Error("Could not create the order. Please try again.");
    }

    // Fire-and-forget purchase events — identical to the old route (failures
    // must never break checkout).
    await Promise.all(
      orderItems.map((item) =>
        this.events.record({
          customer,
          anonymousId: cleanAnonymousRecommendationId(input.anonymousId),
          bookId: item.book.id,
          eventType: "purchase",
          source: "checkout",
        }),
      ),
    ).catch(() => undefined);

    return { orderNumber };
  }
}
