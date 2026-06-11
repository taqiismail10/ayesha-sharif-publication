import { Module } from "@nestjs/common";
import { RecommendationEventsService } from "./recommendation-events.service";
import { RecommendationsController } from "./recommendations.controller";
import { RecommendationsService } from "./recommendations.service";

/**
 * Phase 2D added RecommendationEventsService (checkout purchase events);
 * Phase 2E added the engine + HTTP endpoints:
 *   GET  /recommendations · POST /recommendations/cart · POST /recommendations/events
 */
@Module({
  controllers: [RecommendationsController],
  providers: [RecommendationEventsService, RecommendationsService],
  exports: [RecommendationEventsService],
})
export class RecommendationsModule {}
