import { NextResponse } from "next/server";
import { isPolicySlug } from "@/lib/policy-definitions";
import { getPublishedPolicy } from "@/lib/policies";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  if (!isPolicySlug(slug)) {
    return NextResponse.json({ ok: false, message: "Policy not found." }, { status: 404 });
  }

  const policy = await getPublishedPolicy(slug);
  if (!policy) {
    return NextResponse.json({ ok: false, message: "Policy not found." }, { status: 404 });
  }

  return NextResponse.json(
    { ok: true, policy },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
