import type { Metadata } from "next";
import { PolicyPage } from "@/components/site/policy-page";

export const metadata: Metadata = { title: "Payment Policy" };

export default function PaymentPolicyPage() {
  return (
    <PolicyPage
      title="Payment Policy"
      intro="Payments are handled manually for this MVP."
      points={[
        "Customers can choose Cash on Delivery, manual bKash, manual Nagad, or manual Rocket.",
        "Manual mobile payments require a transaction ID and remain pending until admin verification.",
        "No real payment gateway is connected in version 1."
      ]}
    />
  );
}
