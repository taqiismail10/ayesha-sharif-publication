/* eslint-disable @typescript-eslint/no-require-imports -- isolated local Worker/D1 contract test. */
const assert = require("node:assert/strict");
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

    await prisma.client.book.create({ data: { title: "Visible sitemap book", slug: "visible-sitemap-book", author: "SEO", regularPrice: 100, salePrice: 90, stockQuantity: 1, status: "published" } });
    await prisma.client.book.create({ data: { title: "Hidden draft", slug: "hidden-sitemap-draft", author: "SEO", regularPrice: 100, salePrice: 90, stockQuantity: 1, status: "draft" } });

    const stamp = "2026-01-01T00:00:00.000Z";
    for (let offset = 0; offset < 5_001; offset += 1_000) {
      const upper = Math.min(999, 5_000 - offset);
      await platform.env.asp_db.prepare(`
        WITH RECURSIVE seq(x) AS (
          SELECT 0 UNION ALL SELECT x + 1 FROM seq WHERE x < ${upper}
        )
        INSERT INTO Book (id,title,slug,author,regularPrice,salePrice,stockQuantity,status,createdAt,updatedAt)
        SELECT 'bulk-' || (x + ${offset}), 'Bulk ' || (x + ${offset}),
          'bulk-sitemap-' || (x + ${offset}), 'SEO', 100, 90, 1, 'published', '${stamp}', '${stamp}'
        FROM seq
      `).run();
    }

    await app.listen(8798, "127.0.0.1");
    const response = await fetch("http://127.0.0.1:8798/seo/sitemap");
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "public, max-age=3600, s-maxage=3600");
    assert.deepEqual(Object.keys(body), ["books"]);
    assert.equal(body.books.length, 5_000, "response is bounded to 5,000 books");
    assert.equal(body.books.some((book) => book.slug === "visible-sitemap-book"), true);
    assert.equal(body.books.some((book) => book.slug === "hidden-sitemap-draft"), false);
    assert.equal(body.books.every((book) => Object.keys(book).length === 2 && typeof book.slug === "string" && !Number.isNaN(Date.parse(book.updatedAt))), true);
    assert.equal(body.books.some((book) => "price" in book || "stockQuantity" in book || "id" in book), false);
    console.log("PASS 8 local D1 sitemap SEO assertions");
  } finally {
    if (app) await app.close();
    await platform.dispose();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
