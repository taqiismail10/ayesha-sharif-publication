import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { privateNoStoreHeaders } from "@/lib/http-cache";
import { canManagePolicies } from "@/lib/policy-admin";
import { getAdminPolicies } from "@/lib/policies";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized." },
      { status: 401, headers: privateNoStoreHeaders },
    );
  }
  if (!canManagePolicies(admin)) {
    return NextResponse.json(
      { ok: false, message: "You do not have permission to manage policies." },
      { status: 403, headers: privateNoStoreHeaders },
    );
  }

  const policies = await getAdminPolicies();
  return NextResponse.json({ ok: true, policies }, { headers: privateNoStoreHeaders });
}
