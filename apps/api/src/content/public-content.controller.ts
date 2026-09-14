import { Controller, Get, Inject } from "@nestjs/common";
import { PublicContentService } from "./public-content.service";

@Controller()
export class PublicContentController {
  constructor(@Inject(PublicContentService) private readonly content: PublicContentService) {}

  @Get("content/site") site() { return this.content.site(); }
  @Get("settings/delivery") delivery() { return this.content.delivery(); }
}
