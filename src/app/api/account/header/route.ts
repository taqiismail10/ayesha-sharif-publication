import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { privateNoStoreHeaders } from "@/lib/http-cache";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const [customer, admin] = await Promise.all([
    getCurrentCustomer(),
    getCurrentAdmin(),
  ]);

  const kind = admin ? "admin" : customer ? "customer" : "guest";

  return NextResponse.json(
    { ok: true, kind },
    { headers: privateNoStoreHeaders },
  );
}
