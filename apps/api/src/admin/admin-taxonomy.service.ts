import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import { PrismaService } from "../prisma/prisma.service";

const fields = {
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a URL-friendly slug."),
  isActive: z.boolean().optional(),
};
const tagSchema = z.object(fields);
const categorySchema = tagSchema.extend({ description: z.string().trim().optional() });
const idSchema = z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/);
export type TaxonomyKind = "categories" | "tags";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

@Injectable()
export class AdminTaxonomyService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  list(kind: TaxonomyKind) {
    const options = { orderBy: { name: "asc" as const }, include: { _count: { select: { books: true } } } };
    return kind === "categories"
      ? this.prisma.client.category.findMany(options)
      : this.prisma.client.tag.findMany(options);
  }

  private id(value: string) {
    const parsed = idSchema.safeParse(value);
    if (!parsed.success) throw new BadRequestException("Invalid taxonomy ID.");
    return parsed.data;
  }

  private input(kind: TaxonomyKind, body: unknown, create: boolean) {
    const source = body && typeof body === "object" && !Array.isArray(body)
      ? { ...body } as Record<string, unknown> : {};
    if (create) {
      if (!source.slug && typeof source.name === "string") source.slug = slugify(source.name);
      // Existing create actions always create active entries.
      source.isActive = true;
    }
    const parsed = (kind === "categories" ? categorySchema : tagSchema).safeParse(source);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message || "Invalid taxonomy data.");
    return parsed.data;
  }

  create(kind: TaxonomyKind, body: unknown) {
    const data = this.input(kind, body, true);
    return kind === "categories"
      ? this.prisma.client.category.create({ data })
      : this.prisma.client.tag.create({ data });
  }

  update(kind: TaxonomyKind, value: string, body: unknown) {
    const id = this.id(value);
    const data = this.input(kind, body, false);
    return kind === "categories"
      ? this.prisma.client.category.update({ where: { id }, data })
      : this.prisma.client.tag.update({ where: { id }, data });
  }

  archive(kind: TaxonomyKind, value: string) {
    const id = this.id(value);
    const options = { where: { id }, data: { isActive: false } };
    return kind === "categories"
      ? this.prisma.client.category.update(options)
      : this.prisma.client.tag.update(options);
  }
}

