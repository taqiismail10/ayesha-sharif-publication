import { Module } from "@nestjs/common";
import { RecommendationsModule } from "../recommendations/recommendations.module";
import { AdminModule } from "../admin/admin.module";
import { OrdersController } from "./orders.controller";
import { CustomerOrdersController } from "./customer-orders.controller";
import { AdminOrdersController } from "./admin-orders.controller";
import { AdminOrdersService } from "./admin-orders.service";
import { AdminOrderExportService } from "./admin-order-export.service";
import { OrdersService } from "./orders.service";

@Module({
  imports: [RecommendationsModule, AdminModule],
  controllers: [OrdersController, CustomerOrdersController, AdminOrdersController],
  providers: [OrdersService, AdminOrdersService, AdminOrderExportService],
})
export class OrdersModule {}
