import type { Metadata } from "next";
import { PublishedPolicyPage } from "@/components/site/published-policy-page";

export const metadata: Metadata = { title: "Payment Policy" };

export default function PaymentPolicyPage() {
  return <PublishedPolicyPage slug="payment-policy" />;
}
