import { redirect } from "next/navigation";
import { clearCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  await clearCustomerSession();
  redirect("/");
}

export async function POST() {
  await clearCustomerSession();
  redirect("/");
}
