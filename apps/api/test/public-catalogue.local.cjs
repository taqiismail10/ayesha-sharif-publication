/* eslint-disable @typescript-eslint/no-require-imports -- isolated local Worker/D1 contract test. */
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const compilerRoot = path.resolve(__dirname, "../src/generated/prisma/internal");
require("node:module").registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "./query_compiler_fast_bg.js") return { url: pathToFileURL(path.join(compilerRoot, "query_compiler_fast_bg.js")).href, shortCircuit: true };
    if (specifier === "./query_compiler_fast_bg.wasm?module") {
      const source = `import fs from 'node:fs'; export default new WebAssembly.Module(fs.readFileSync(${JSON.stringify(path.join(compilerRoot, "query_compiler_fast_bg.wasm"))}));`;
      return { url: `data:text/javascript,${encodeURIComponent(source)}`, shortCircuit: true };
    }
    return next(specifier, context);
  },
});

const { getPlatformProxy, unstable_splitSqlQuery } = require("wrangler");
const { NestFactory } = require("@nestjs/core");
const { AppModule } = require("../dist/app.module");
const { configureApplication } = require("../dist/bootstrap");
const { PrismaService } = require("../dist/prisma/prisma.service");

async function main() {
  const platform = await getPlatformProxy({ configPath: path.resolve(__dirname, "../wrangler.jsonc"), envFiles: [], persist: false, remoteBindings: false });
  let app;
  try {
    const sql = fs.readFileSync(path.resolve(__dirname, "../../../prisma/migrations/0001_init.sql"), "utf8");
    for (const statement of unstable_splitSqlQuery(sql)) if (statement.trim()) await platform.env.asp_db.prepare(statement).run();
    app = await NestFactory.create(AppModule, { logger: ["error", "warn"] });
    const prisma = app.get(PrismaService);
    prisma.bind(platform.env.asp_db);
    configureApplication(app);

    const category = await prisma.client.category.create({ data: { name: "Fiction", slug: "fiction" } });
    const tag = await prisma.client.tag.create({ data: { name: "Featured", slug: "featured" } });
    const book = await prisma.client.book.create({
      data: {
        title: "D1 Public Book", slug: "d1-public-book", author: "Reader", categoryId: category.id,
        regularPrice: 450.5, salePrice: 399.25, discountPercent: 11, stockQuantity: 7,
        status: "published", isFeatured: true, isNewArrival: true,
        galleryImages: ["uploads/books/cover.webp"], tags: { create: { tagId: tag.id } },
      },
    });
    await prisma.client.siteSetting.create({ data: { key: "delivery_charges", value: { inside_dhaka: 80 } } });
    await prisma.client.siteSetting.create({ data: { key: "site_content.homepage", value: { heroEyebrow: "D1", heroSubtitle: "Public content", heroMeta: "Verified", features: [] } } });
    await prisma.client.policy.create({ data: { slug: "delivery-policy", title: "Draft title", content: "Draft content", publishedTitle: "Public title", publishedContent: "Published content", status: "published", publishedAt: new Date("2026-01-01T00:00:00.000Z") } });
    await prisma.client.policy.create({ data: { slug: "payment-policy", title: "Draft only", content: "Do not publish", status: "draft" } });
    await app.listen(8795, "127.0.0.1");

    const request = async (path) => {
      const response = await fetch(`http://127.0.0.1:8795${path}`);
      return { status: response.status, body: await response.json() };
    };
    const checks = [];
    const check = (name, actual, expected) => { assert.deepEqual(actual, expected, name); checks.push(name); };

    const home = await request("/catalogue/home");
    check("home status", home.status, 200);
    check("home card money/category", [home.body.featured[0].regularPrice, home.body.featured[0].salePrice, home.body.categories[0].slug], [450.5, 399.25, "fiction"]);
    const list = await request("/books?q=public&category=fiction&sort=price-low");
    check("list contract", [list.status, list.body.books.length, list.body.books[0].tags], [200, 1, ["Featured"]]);
    const detail = await request("/books/d1-public-book");
    check("detail JSON/date", [detail.status, detail.body.book.galleryImages, detail.body.book.publicationDate], [200, ["uploads/books/cover.webp"], null]);
    check("missing book", (await request("/books/missing")).status, 404);
    check("taxonomy and languages", [(await request("/categories")).body.length, (await request("/tags")).body.length, (await request("/languages")).body], [1, 1, ["Bangla"]]);
    const content = await request("/content/site");
    check("content default and override", [content.status, content.body.homepage.heroEyebrow, content.body.footer.tagline], [200, "D1", "Quality books, delivered to your doorstep."]);
    check("delivery contract", [(await request("/settings/delivery")).status, (await request("/settings/delivery")).body[0].charge], [200, 80]);
    const policy = await request("/policies/delivery-policy");
    check("published policy only", [policy.status, policy.body.title, policy.body.content, policy.body.publishedAt], [200, "Public title", "Published content", "2026-01-01T00:00:00.000Z"]);
    const policyList = await request("/policies");
    check("policy list", [policyList.status, policyList.body.length], [200, 3]);
    check("unpublished policy hidden", (await request("/policies/payment-policy")).status, 404);
    check("unknown policy", (await request("/policies/unknown")).status, 404);
    console.log(`PASS ${checks.length} local D1 public catalogue/content/policy assertions`);
  } finally {
    if (app) await app.close();
    await platform.dispose();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
