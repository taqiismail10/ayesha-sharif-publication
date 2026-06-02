import type { Metadata } from "next";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { getDeliveryOptions } from "@/lib/settings";
import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Place an order as a guest or signed-in customer."
};

export default async function CheckoutPage() {
  const [deliveryOptions, customer] = await Promise.all([
    getDeliveryOptions(),
    getCurrentCustomer()
  ]);

  return (
    <CheckoutPageClient
      deliveryOptions={deliveryOptions}
      initialCustomer={
        customer
          ? {
              name: customer.profile?.displayName || customer.name,
              phone: customer.profile?.phone || customer.phone || null,
              email: customer.profile?.email || customer.email || null,
              district: customer.profile?.defaultDistrict || null,
              deliveryArea: customer.profile?.defaultDeliveryArea || null,
              address: customer.profile?.defaultAddress || null
            }
          : null
      }
    />
  );
}
