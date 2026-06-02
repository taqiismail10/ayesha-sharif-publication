import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { privateNoStoreHeaders } from "@/lib/http-cache";
import {
  cleanAnonymousRecommendationId,
  recommendationEventTypes,
  recordRecommendationEvent
} from "@/lib/recommendation-events";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const eventSchema = z.object({
  bookId: z.string().min(1),
  eventType: z.enum(recommendationEventTypes),
  anonymousId: z.string().optional().nullable(),
  source: z.string().max(80).optional().nullable()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, tracked: false },
      { status: 400, headers: privateNoStoreHeaders }
    );
  }

  const customer = await getCurrentCustomer();
  const tracked = await recordRecommendationEvent({
    customer,
    anonymousId: cleanAnonymousRecommendationId(parsed.data.anonymousId),
    bookId: parsed.data.bookId,
    eventType: parsed.data.eventType,
    source: parsed.data.source
  }).catch(() => false);

  return NextResponse.json(
    { ok: true, tracked },
    { headers: privateNoStoreHeaders }
  );
}
