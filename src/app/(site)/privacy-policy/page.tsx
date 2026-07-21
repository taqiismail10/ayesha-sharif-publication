import type { Metadata } from "next";
import { PublishedPolicyPage } from "@/components/site/published-policy-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return <PublishedPolicyPage slug="privacy-policy" />;
}
