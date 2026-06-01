import { deliveryAreas, type DeliveryAreaOption } from "@/lib/constants";
import type { CartItem } from "@/types";

export function deliveryChargeFor(
  deliveryArea: string,
  options: DeliveryAreaOption[] = deliveryAreas
) {
  return options.find((area) => area.value === deliveryArea)?.charge ?? 120;
}

export function calculateCartTotals(
  items: CartItem[],
  deliveryArea = "other",
  options: DeliveryAreaOption[] = deliveryAreas
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.regularPrice * item.quantity,
    0
  );
  const saleSubtotal = items.reduce(
    (sum, item) => sum + item.salePrice * item.quantity,
    0
  );
  const discountTotal = Math.max(subtotal - saleSubtotal, 0);
  const deliveryCharge = items.length ? deliveryChargeFor(deliveryArea, options) : 0;
  const grandTotal = saleSubtotal + deliveryCharge;

  return { subtotal, discountTotal, deliveryCharge, grandTotal };
}

export function createOrderNumber() {
  const date = new Date();
  const stamp = date
    .toISOString()
    .slice(2, 10)
    .replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ASP-${stamp}-${random}`;
}
