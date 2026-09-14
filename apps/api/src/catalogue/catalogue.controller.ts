import { Controller, Get, Inject, Param, Query } from "@nestjs/common";
import { CatalogueService } from "./catalogue.service";

@Controller()
export class CatalogueController {
  constructor(@Inject(CatalogueService) private readonly catalogue: CatalogueService) {}

  @Get("catalogue/home") home() { return this.catalogue.home(); }
  @Get("books") list(@Query() query: Record<string, string | undefined>) { return this.catalogue.list(query); }
  @Get("books/:slug") detail(@Param("slug") slug: string) { return this.catalogue.detail(slug); }
  @Get("categories") categories() { return this.catalogue.categories(); }
  @Get("tags") tags() { return this.catalogue.tags(); }
  @Get("languages") languages() { return this.catalogue.languages(); }
}
