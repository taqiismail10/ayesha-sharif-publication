import { Controller, Get, Header, Inject } from "@nestjs/common";
import { SeoService } from "./seo.service";

/** Public, intentionally minimal source data for Next.js sitemap rendering. */
@Controller("seo")
export class SeoController {
  constructor(@Inject(SeoService) private readonly seo: SeoService) {}

  @Get("sitemap")
  @Header("Cache-Control", "public, max-age=3600, s-maxage=3600")
  sitemap() {
    return this.seo.sitemap();
  }
}
