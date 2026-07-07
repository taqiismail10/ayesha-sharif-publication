import type { Metadata } from "next";
import { PublishedPolicyPage } from "@/components/site/published-policy-page";

export const metadata: Metadata = { title: "Delivery Policy" };

export default function DeliveryPolicyPage() {
  return <PublishedPolicyPage slug="delivery-policy" />;
}
