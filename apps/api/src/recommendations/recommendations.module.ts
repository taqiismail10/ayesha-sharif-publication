import { Module } from "@nestjs/common";
import { RecommendationEventsService } from "./recommendation-events.service";

/**
 * Phase 2D scope: SERVICE ONLY (checkout purchase events).
 * Recommendation HTTP endpoints (GET /recommendations, POST …/cart,
 * POST …/events) are added in Phase 2E.
 */
@Module({
  providers: [RecommendationEventsService],
  exports: [RecommendationEventsService],
})
export class RecommendationsModule {}
