import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { privateNoStoreHeaders } from "@/lib/http-cache";
import {
  getCartRecommendations,
  getPersonalizedRecommendations
} from "@/lib/recommendations";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const cartRecommendationSchema = z.object({
  bookIds: z.array(z.string().min(1)).max(30)
});

function cleanAnonymousId(value: string | null) {
  if (!value) return null;
  return /^[a-zA-Z0-9_-]{16,80}$/.test(value) ? value : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const anonymousId = cleanAnonymousId(url.searchParams.get("anonymousId"));
  const customer = await getCurrentCustomer();
  const books = await getPersonalizedRecommendations({
    customerId: customer?.id,
    anonymousId,
    take: 8
  });

  return NextResponse.json({ ok: true, books }, { headers: privateNoStoreHeaders });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = cartRecommendationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid recommendation request." },
      { status: 400, headers: privateNoStoreHeaders }
    );
  }

  const books = await getCartRecommendations(parsed.data.bookIds, 4);
  return NextResponse.json({ ok: true, books }, { headers: privateNoStoreHeaders });
}
