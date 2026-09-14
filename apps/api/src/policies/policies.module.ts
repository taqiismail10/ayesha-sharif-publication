import { Module } from "@nestjs/common";
import { PublicPoliciesController } from "./public-policies.controller";
import { PublicPoliciesService } from "./public-policies.service";

@Module({ controllers: [PublicPoliciesController], providers: [PublicPoliciesService] })
export class PoliciesModule {}
