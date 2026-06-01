import type { Metadata } from "next";
import { PolicyPage } from "@/components/site/policy-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro="This placeholder explains how customer checkout data is used."
      points={[
        "Customer name, phone, address, district, and optional email are collected only to process orders.",
        "No public customer accounts are created in this MVP.",
        "Admin users should protect order data and avoid sharing it outside delivery and support needs."
      ]}
    />
  );
}
