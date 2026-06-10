import type { Metadata } from "next";
import { AuditContent } from "./audit-content";

export const metadata: Metadata = {
  title: "Codebase & Product Audit",
  description:
    "A code-grounded audit of the Ayesha-Sharif Publication bookstore platform — architecture, data model, security, design consistency, and launch readiness.",
};

export default function AuditPage() {
  return <AuditContent />;
}
