import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";
import { privateNoStoreHeaders } from "@/lib/http-cache";

const allowedRoles = ["super_admin", "admin", "order_manager"];

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin || !allowedRoles.includes(admin.role)) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized." },
      { status: 401, headers: privateNoStoreHeaders }
    );
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q") || undefined;
  const orderStatus = url.searchParams.get("orderStatus") as OrderStatus | null;
  const paymentStatus = url.searchParams.get("paymentStatus") as PaymentStatus | null;

  const orders = await prisma.order.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { orderNumber: { contains: q, mode: "insensitive" } },
                { customerName: { contains: q, mode: "insensitive" } },
                { customerPhone: { contains: q, mode: "insensitive" } },
                { customerEmail: { contains: q, mode: "insensitive" } },
                { customer: { is: { email: { contains: q, mode: "insensitive" } } } },
                { customer: { is: { phone: { contains: q, mode: "insensitive" } } } }
              ]
            }
          : {},
        orderStatus ? { orderStatus } : {},
        paymentStatus ? { paymentStatus } : {}
      ]
    },
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });

  const header = [
    "Order Number",
    "Customer Name",
    "Phone",
    "District",
    "Delivery Area",
    "Payment Method",
    "Payment Status",
    "Order Status",
    "Subtotal",
    "Discount",
    "Delivery",
    "Grand Total",
    "Items",
    "Created At"
  ];

  const rows = orders.map((order) => [
    order.orderNumber,
    order.customerName,
    order.customerPhone,
    order.district,
    order.deliveryArea,
    order.paymentMethod,
    order.paymentStatus,
    order.orderStatus,
    toNumber(order.subtotal),
    toNumber(order.discountTotal),
    toNumber(order.deliveryCharge),
    toNumber(order.grandTotal),
    order.items
      .map((item) => `${item.bookTitleSnapshot} x ${item.quantity}`)
      .join("; "),
    order.createdAt.toISOString()
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      ...privateNoStoreHeaders,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${Date.now()}.csv"`
    }
  });
}
