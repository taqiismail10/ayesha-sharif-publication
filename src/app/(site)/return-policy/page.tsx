import type { Metadata } from "next";
import { PolicyPage } from "@/components/site/policy-page";

export const metadata: Metadata = { title: "Return Policy" };

export default function ReturnPolicyPage() {
  return (
    <PolicyPage
      title="Return Policy"
      intro="This placeholder policy should be replaced with final business terms."
      points={[
        "Returns may be accepted for damaged, wrong, or missing books if reported quickly after delivery.",
        "Customers should keep the invoice/order number for support.",
        "Refunds, replacements, and return delivery rules are handled manually by admin."
      ]}
    />
  );
}
