import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpException,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { z } from "zod";
import { CustomerAuthService } from "../customer-auth/customer-auth.service";
import {
  RecommendationEventsService,
  cleanAnonymousRecommendationId,
  recommendationEventTypes,
  type RecommendationEventType,
} from "./recommendation-events.service";
import { RecommendationsService } from "./recommendations.service";

/**
 * Phase 2E — drop-in replacements for the old Next.js routes:
 *   GET  /api/recommendations          → GET  /recommendations
 *   POST /api/recommendations          → POST /recommendations/cart
 *   POST /api/recommendation-events    → POST /recommendations/events
 *
 * Response shapes preserved (client-recommendation-section.tsx reads
 * {ok, books}; tracking-client.ts fire-and-forgets {ok, tracked}).
 */

const cartRecommendationSchema = z.object({
  bookIds: z.array(z.string().min(1)).max(30),
});

const eventSchema = z.object({
  bookId: z.string().min(1),
  eventType: z.enum(recommendationEventTypes),
  anonymousId: z.string().optional().nullable(),
  source: z.string().max(80).optional().nullable(),
});

@Controller("recommendations")
export class RecommendationsController {
  constructor(
    private readonly recommendations: RecommendationsService,
    private readonly events: RecommendationEventsService,
    private readonly auth: CustomerAuthService,
  ) {}

  /** GET /recommendations?anonymousId= — personalized, 8 books. */
  @Get()
  @Header("Cache-Control", "private, no-store, max-age=0, must-revalidate")
  @Header("Pragma", "no-cache")
  @Header("Expires", "0")
  async personalized(
    @Query("anonymousId") rawAnonymousId: string | undefined,
    @Req() req: Request,
  ) {
    const anonymousId = cleanAnonymousRecommendationId(rawAnonymousId ?? null);
    const customer = await this.auth.resolveCustomer(req);
    const books = await this.recommendations.getPersonalizedRecommendations({
      customerId: customer?.id,
      anonymousId,
      take: 8,
    });
    return { ok: true, books };
  }

  /** POST /recommendations/cart — cart-based, 4 books. */
  @Post("cart")
  @HttpCode(200)
  @Header("Cache-Control", "private, no-store, max-age=0, must-revalidate")
  @Header("Pragma", "no-cache")
  @Header("Expires", "0")
  async cart(@Body() body: unknown) {
    const parsed = cartRecommendationSchema.safeParse(body);
    if (!parsed.success) {
      // Old route's exact error body.
      throw new HttpException(
        { ok: false, message: "Invalid recommendation request." },
        400,
      );
    }

    const books = await this.recommendations.getCartRecommendations(
      parsed.data.bookIds,
      4,
    );
    return { ok: true, books };
  }

  /** POST /recommendations/events — consent-aware tracking. */
  @Post("events")
  @HttpCode(200)
  @Header("Cache-Control", "private, no-store, max-age=0, must-revalidate")
  @Header("Pragma", "no-cache")
  @Header("Expires", "0")
  async track(@Body() body: unknown, @Req() req: Request) {
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      // Old route's exact error body (no message field).
      throw new HttpException({ ok: false, tracked: false }, 400);
    }

    const customer = await this.auth.resolveCustomer(req);
    const tracked = await this.events
      .record({
        customer,
        anonymousId: cleanAnonymousRecommendationId(parsed.data.anonymousId),
        bookId: parsed.data.bookId,
        eventType: parsed.data.eventType as RecommendationEventType,
        source: parsed.data.source,
      })
      .catch(() => false);

    return { ok: true, tracked };
  }
}
