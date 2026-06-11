import { Module } from "@nestjs/common";
import { RecommendationsModule } from "../recommendations/recommendations.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [RecommendationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
