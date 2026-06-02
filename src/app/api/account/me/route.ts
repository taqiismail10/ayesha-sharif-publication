import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { privateNoStoreHeaders } from "@/lib/http-cache";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const customer = await getCurrentCustomer();
  return NextResponse.json(
    {
      ok: true,
      customer: customer
        ? {
            name: customer.profile?.displayName || customer.name,
            email: customer.email,
            phone: customer.phone
          }
        : null
    },
    { headers: privateNoStoreHeaders }
  );
}
