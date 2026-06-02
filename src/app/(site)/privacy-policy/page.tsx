import type { Metadata } from "next";
import { PolicyPage } from "@/components/site/policy-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro="This page explains the basic data used by Ayesha-Sharif Publication. It is practical guidance for customers and should be legally reviewed before a formal launch."
      points={[
        "Account data: if you create an optional account, we store your name, email or phone, hashed password, login session records, profile details, and delivery defaults so you can sign in and track orders.",
        "Order data: we store customer name, phone, optional email, shipping address, district, delivery area, ordered books, payment method, transaction ID when provided, courier details, and order status so the team can process and support orders.",
        "Recommendation data: if personalization is enabled, we may store book events such as views, add-to-cart actions, sample opens, and purchases. Anonymous events use a random browser ID, never your phone or email.",
        "Cookie preferences: necessary cookies and localStorage keep cart and sessions working. Optional personalization, analytics placeholder, and marketing preferences can be changed from Cookie Settings.",
        "Control: customers can update profile details, turn off personalization, change cookie preferences, or contact the publication team to request manual deletion or correction of account data.",
        "We do not add third-party tracking scripts, payment gateways, courier APIs, public reviews, or loyalty systems in this phase."
      ]}
    />
  );
}
