import type { Metadata } from "next";
import { PolicyPage } from "@/components/site/policy-page";

export const metadata: Metadata = { title: "Terms and Conditions" };

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms and Conditions"
      intro="These placeholder terms should be reviewed before accepting real customer orders."
      points={[
        "Book prices, discounts, and stock status may change before admin confirms an order.",
        "Ayesha-Sharif Publication may cancel fake, duplicate, or unreachable orders.",
        "Using this website means the customer agrees to manual payment verification and manual delivery updates."
      ]}
    />
  );
}
