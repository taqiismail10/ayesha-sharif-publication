import { Module } from "@nestjs/common";
import { RecommendationsModule } from "../recommendations/recommendations.module";
import { OrdersController } from "./orders.controller";
import { CustomerOrdersController } from "./customer-orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [RecommendationsModule],
  controllers: [OrdersController, CustomerOrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
