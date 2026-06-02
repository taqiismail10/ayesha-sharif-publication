import type { Metadata } from "next";
import { getDeliveryOptions } from "@/lib/settings";
import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Guest Checkout",
  description: "Place an order without a customer account."
};

export default async function CheckoutPage() {
  return <CheckoutPageClient deliveryOptions={await getDeliveryOptions()} />;
}
