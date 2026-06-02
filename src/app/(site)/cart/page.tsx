import type { Metadata } from "next";
import { getDeliveryOptions } from "@/lib/settings";
import { CartPageClient } from "@/components/cart/cart-page-client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your guest shopping cart."
};

export default async function CartPage() {
  return <CartPageClient deliveryOptions={await getDeliveryOptions()} />;
}
