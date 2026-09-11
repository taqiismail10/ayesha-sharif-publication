import {
  Controller,
  Get,
  Inject,
  Param,
  UseGuards,
} from "@nestjs/common";
import { CurrentCustomer } from "../common/decorators/current-customer.decorator";
import { CustomerGuard } from "../common/guards/customer.guard";
import type { CurrentCustomer as CurrentCustomerType } from "../customer-auth/customer-auth.service";
import { OrdersService } from "./orders.service";

@Controller("customers/me/orders")
@UseGuards(CustomerGuard)
export class CustomerOrdersController {
  constructor(
    @Inject(OrdersService) private readonly orders: OrdersService,
  ) {}

  @Get()
  list(@CurrentCustomer() customer: CurrentCustomerType) {
    return this.orders.listCustomerOrders(customer.id);
  }

  @Get(":orderNumber")
  get(
    @CurrentCustomer() customer: CurrentCustomerType,
    @Param("orderNumber") orderNumber: string,
  ) {
    return this.orders.getCustomerOrder(customer.id, orderNumber);
  }
}
