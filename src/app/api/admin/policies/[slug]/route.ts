import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { privateNoStoreHeaders } from "@/lib/http-cache";
import { canManagePolicies, savePolicyDraft } from "@/lib/policy-admin";
import { isPolicySlug, policyDraftSchema } from "@/lib/policy-definitions";
import { getAdminPolicy } from "@/lib/policies";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type RouteContext = { params: Promise<{ slug: string }> };

async function authorize() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return {
      response: NextResponse.json(
        { ok: false, message: "Unauthorized." },
        { status: 401, headers: privateNoStoreHeaders },
      ),
    };
  }
  if (!canManagePolicies(admin)) {
    return {
      response: NextResponse.json(
        { ok: false, message: "You do not have permission to manage policies." },
        { status: 403, headers: privateNoStoreHeaders },
      ),
    };
  }
  return { admin };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;

  const { slug } = await params;
  if (!isPolicySlug(slug)) {
    return NextResponse.json(
      { ok: false, message: "Policy not found." },
      { status: 404, headers: privateNoStoreHeaders },
    );
  }

  const policy = await getAdminPolicy(slug);
  return NextResponse.json({ ok: true, policy }, { headers: privateNoStoreHeaders });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;

  const { slug } = await params;
  if (!isPolicySlug(slug)) {
    return NextResponse.json(
      { ok: false, message: "Policy not found." },
      { status: 404, headers: privateNoStoreHeaders },
    );
  }

  try {
    const body = await request.json();
    const parsed = policyDraftSchema.safeParse({ ...body, slug });
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid policy." },
        { status: 400, headers: privateNoStoreHeaders },
      );
    }

    const policy = await savePolicyDraft(parsed.data, auth.admin.id);
    return NextResponse.json({ ok: true, policy }, { headers: privateNoStoreHeaders });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Unable to save the policy draft." },
      { status: 500, headers: privateNoStoreHeaders },
    );
  }
}
