import { NextResponse } from "next/server";
import type { BookStatus, PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validators";
import { createOrderNumber, deliveryChargeFor } from "@/lib/order-utils";
import { toNumber } from "@/lib/format";
import { getDeliveryOptions } from "@/lib/settings";
import { hasUsableDatabaseUrl } from "@/lib/env";
import { privateNoStoreHeaders } from "@/lib/http-cache";
import { getCurrentCustomer } from "@/lib/customer-auth";
import {
  cleanAnonymousRecommendationId,
  recordRecommendationEvent
} from "@/lib/recommendation-events";

const purchasableStatuses: BookStatus[] = ["published", "pre_order"];

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function uniqueOrderNumber() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = createOrderNumber();
    const exists = await prisma.order.findUnique({ where: { orderNumber } });
    if (!exists) return orderNumber;
  }
  throw new Error("Could not create a unique order number.");
}

export async function POST(request: Request) {
  try {
    if (!hasUsableDatabaseUrl()) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Database is not configured yet. You can preview the storefront, but real order creation needs PostgreSQL."
        },
        { status: 503, headers: privateNoStoreHeaders }
      );
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: parsed.error.issues[0]?.message || "Invalid checkout information."
        },
        { status: 400, headers: privateNoStoreHeaders }
      );
    }

    const input = parsed.data as {
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      shippingAddress: string;
      district: string;
      deliveryArea: string;
      paymentMethod: PaymentMethod;
      transactionId?: string;
      notes?: string;
      anonymousId?: string | null;
      items: Array<{ bookId: string; quantity: number }>;
    };
    const currentCustomer = await getCurrentCustomer();
    const bookIds = input.items.map((item) => item.bookId);
    const books = await prisma.book.findMany({
      where: { id: { in: bookIds } }
    });
    const bookById = new Map(books.map((book) => [book.id, book]));

    const orderItems = input.items.map((item) => {
      const book = bookById.get(item.bookId);
      if (!book) {
        throw new Error("One or more books are no longer available.");
      }
      if (!purchasableStatuses.includes(book.status) || book.stockQuantity < item.quantity) {
        throw new Error(`${book.title} is not available in the requested quantity.`);
      }
      const regularPrice = toNumber(book.regularPrice);
      const unitPrice = toNumber(book.salePrice);
      return {
        book,
        quantity: item.quantity,
        regularTotal: regularPrice * item.quantity,
        totalPrice: unitPrice * item.quantity,
        unitPrice
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.regularTotal, 0);
    const saleSubtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountTotal = Math.max(subtotal - saleSubtotal, 0);
    const deliveryCharge = deliveryChargeFor(
      input.deliveryArea,
      await getDeliveryOptions()
    );
    const grandTotal = saleSubtotal + deliveryCharge;
    const orderNumber = await uniqueOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: currentCustomer?.id,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
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
        orderStatus: "pending",
        transactionId: input.transactionId,
        notes: input.notes,
        items: {
          create: orderItems.map((item) => ({
            bookId: item.book.id,
            bookTitleSnapshot: item.book.title,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }))
        }
      }
    });

    await Promise.all(
      orderItems.map((item) =>
        recordRecommendationEvent({
          customer: currentCustomer,
          anonymousId: cleanAnonymousRecommendationId(input.anonymousId),
          bookId: item.book.id,
          eventType: "purchase",
          source: "checkout"
        })
      )
    ).catch(() => undefined);

    return NextResponse.json(
      {
        ok: true,
        orderNumber: order.orderNumber
      },
      { headers: privateNoStoreHeaders }
    );
  } catch (caught) {
    return NextResponse.json(
      {
        ok: false,
        message:
          caught instanceof Error ? caught.message : "Failed to create order."
      },
      { status: 400, headers: privateNoStoreHeaders }
    );
  }
}
