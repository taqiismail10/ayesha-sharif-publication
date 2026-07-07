import type { Metadata } from "next";
import { PolicyPage } from "@/components/site/policy-page";

export const metadata: Metadata = { title: "Terms and Conditions" };

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms and Conditions"
      content={`These simple terms describe how the bookstore MVP works. They should be reviewed before accepting real customer orders at scale.

Book prices, discounts, and stock status may change before admin confirms an order.

Customer accounts are optional. Guest checkout remains available, but guest orders are tracked by order number rather than account order history.

Ayesha-Sharif Publication may cancel fake, duplicate, or unreachable orders.

Using this website means the customer agrees to manual payment verification and manual delivery updates.

Customers are responsible for keeping account passwords private and for entering correct delivery and payment information.

Personalized recommendations are suggestions based on book metadata, profile preferences, and consent-based activity. They do not guarantee availability or suitability.`}
    />
  );
}
