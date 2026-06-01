import type { Metadata } from "next";
import { PolicyPage } from "@/components/site/policy-page";

export const metadata: Metadata = { title: "Delivery Policy" };

export default function DeliveryPolicyPage() {
  return (
    <PolicyPage
      title="Delivery Policy"
      intro="This placeholder policy should be reviewed before launch."
      points={[
        "Inside Dhaka delivery charge is ৳70. Outside Dhaka delivery charge is ৳120.",
        "Inside Chattogram delivery charge is ৳60. Outside Chattogram delivery charge is ৳120.",
        "Admin staff will manually update courier name and tracking number after dispatch."
      ]}
    />
  );
}
