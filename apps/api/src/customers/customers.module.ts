import { Module } from "@nestjs/common";
import { CustomersController } from "./customers.controller";
import { CustomersService } from "./customers.service";
import { SavedBooksController } from "./saved-books.controller";
import { SavedBooksService } from "./saved-books.service";

@Module({
  controllers: [CustomersController, SavedBooksController],
  providers: [CustomersService, SavedBooksService],
})
export class CustomersModule {}
