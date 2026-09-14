import { Controller, Get, Inject, Param } from "@nestjs/common";
import { PublicPoliciesService } from "./public-policies.service";

@Controller()
export class PublicPoliciesController {
  constructor(@Inject(PublicPoliciesService) private readonly policies: PublicPoliciesService) {}

  @Get("policies") list() { return this.policies.list(); }
  @Get("policies/:slug") bySlug(@Param("slug") slug: string) { return this.policies.bySlug(slug); }
}
