import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { AdminBooksController } from "./admin-books.controller";
import { AdminBooksService } from "./admin-books.service";

@Module({ imports: [AdminModule], controllers: [AdminBooksController], providers: [AdminBooksService] })
export class BooksModule {}
