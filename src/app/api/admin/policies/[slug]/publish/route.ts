import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { revalidatePublicPolicy } from "@/lib/cache-invalidation";
import { privateNoStoreHeaders } from "@/lib/http-cache";
import { canManagePolicies, publishPolicy } from "@/lib/policy-admin";
import { isPolicySlug, policyPublishSchema } from "@/lib/policy-definitions";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: RouteContext) {
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

  const { slug } = await params;
  if (!isPolicySlug(slug)) {
    return NextResponse.json(
      { ok: false, message: "Policy not found." },
      { status: 404, headers: privateNoStoreHeaders },
    );
  }

  try {
    const body = await request.json();
    const parsed = policyPublishSchema.safeParse({ ...body, slug });
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid policy." },
        { status: 400, headers: privateNoStoreHeaders },
      );
    }

    const policy = await publishPolicy(parsed.data, admin.id);
    revalidatePublicPolicy(slug);
    return NextResponse.json({ ok: true, policy }, { headers: privateNoStoreHeaders });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Unable to publish the policy." },
      { status: 500, headers: privateNoStoreHeaders },
    );
  }
}
