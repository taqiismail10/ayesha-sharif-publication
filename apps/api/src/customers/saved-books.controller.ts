import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CustomerGuard } from "../common/guards/customer.guard";
import { CurrentCustomer } from "../common/decorators/current-customer.decorator";
import type { CurrentCustomer as CurrentCustomerType } from "../customer-auth/customer-auth.service";
import { SavedBooksService } from "./saved-books.service";

function bookIdFrom(body: unknown) {
  const bookId =
    typeof body === "object" && body !== null && "bookId" in body &&
    typeof body.bookId === "string"
      ? body.bookId.trim()
      : "";
  if (!bookId) throw new BadRequestException("Choose a valid book.");
  return bookId;
}

@Controller("customers/me/saved-books")
@UseGuards(CustomerGuard)
export class SavedBooksController {
  constructor(
    @Inject(SavedBooksService) private readonly savedBooks: SavedBooksService,
  ) {}

  @Get()
  async list(@CurrentCustomer() customer: CurrentCustomerType) {
    return {
      ok: true,
      authenticated: true,
      savedBookIds: await this.savedBooks.list(customer),
    };
  }

  @Post()
  async save(
    @CurrentCustomer() customer: CurrentCustomerType,
    @Body() body: unknown,
  ) {
    return this.savedBooks.save(customer, bookIdFrom(body));
  }

  @Delete()
  async remove(
    @CurrentCustomer() customer: CurrentCustomerType,
    @Body() body: unknown,
  ) {
    return this.savedBooks.remove(customer, bookIdFrom(body));
  }
}
