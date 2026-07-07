import type { Metadata } from "next";
import { PublishedPolicyPage } from "@/components/site/published-policy-page";

export const metadata: Metadata = { title: "Return Policy" };

export default function ReturnPolicyPage() {
  return <PublishedPolicyPage slug="return-policy" />;
}
