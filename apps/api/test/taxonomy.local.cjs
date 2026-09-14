/* eslint-disable @typescript-eslint/no-require-imports -- Local harness loads compiled NestJS CommonJS modules. */
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
// Adapt only the generated Cloudflare WASM imports to the Node test host.
// Production still runs the unmodified client through Wrangler.
const compilerRoot = path.resolve(__dirname, "../src/generated/prisma/internal");
require("node:module").registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "./query_compiler_fast_bg.js") {
      return { url: pathToFileURL(path.join(compilerRoot, "query_compiler_fast_bg.js")).href, shortCircuit: true };
    }
    if (specifier === "./query_compiler_fast_bg.wasm?module") {
      const filename = path.join(compilerRoot, "query_compiler_fast_bg.wasm");
      const source = "import fs from 'node:fs'; export default new WebAssembly.Module(fs.readFileSync(" + JSON.stringify(filename) + "));";
      return { url: "data:text/javascript," + encodeURIComponent(source), shortCircuit: true };
    }
    return next(specifier, context);
  },
});
const { getPlatformProxy, unstable_splitSqlQuery } = require("wrangler");
const { Module } = require("@nestjs/common");
const { NestFactory } = require("@nestjs/core");
const { AdminModule } = require("../dist/admin/admin.module");
const { BooksModule } = require("../dist/books/books.module");
const { PrismaModule } = require("../dist/prisma/prisma.module");
const { PrismaService } = require("../dist/prisma/prisma.service");
const { PrismaExceptionFilter } = require("../dist/common/filters/prisma-exception.filter");
const { configureApplication } = require("../dist/bootstrap");

async function main() {
  const platform = await getPlatformProxy({
    configPath: path.resolve(__dirname, "../wrangler.jsonc"),
    envFiles: [], persist: false, remoteBindings: false,
  });
  const db = platform.env.asp_db;
  let app;
  try {
    for (const file of ["0001_init.sql", "20260911090000_add_admin_sessions/migration.sql"]) {
      const sql = fs.readFileSync(path.resolve(__dirname, "../../../prisma/migrations", file), "utf8");
      for (const statement of unstable_splitSqlQuery(sql)) {
        if (statement.trim()) await db.prepare(statement).run();
      }
    }
    class TestModule {}
    Module({ imports: [PrismaModule, AdminModule, BooksModule] })(TestModule);
    app = await NestFactory.create(TestModule, { logger: false });
    const prisma = app.get(PrismaService);
    prisma.bind(db);
    configureApplication(app);
    app.useGlobalFilters(new PrismaExceptionFilter());
    const tokens = {};
    for (const role of ["super_admin", "admin", "editor", "order_manager"]) {
      const admin = await prisma.client.admin.create({ data: {
        name: role, email: role + "@test.invalid",
        passwordHash: crypto.randomBytes(32).toString("hex"), role,
      } });
      tokens[role] = crypto.randomBytes(32).toString("hex");
      await prisma.client.adminSession.create({ data: {
        adminId: admin.id, tokenHash: crypto.createHash("sha256").update(tokens[role]).digest("hex"),
        expiresAt: new Date(Date.now() + 3600000),
      } });
    }
    // Test harness only: never registered in AppModule or the deployed Worker.
    if (process.argv.includes("--serve")) {
      app.use("/__test/session", (req, res) => {
        const role = req.query.role || "editor";
        if (!Object.hasOwn(tokens, role)) return res.sendStatus(400);
        res.cookie("asp_admin_session", tokens[role], { httpOnly: true, sameSite: "lax", path: "/" });
        res.send("Local fixture session ready");
      });
    }
    await app.listen(8790, "127.0.0.1");
    const request = async (kind, method = "GET", body, role = "editor", suffix = "") => {
      const response = await fetch("http://127.0.0.1:8790/admin/" + kind + suffix, {
        method, headers: {
          "Content-Type": "application/json",
          ...(role ? { cookie: role === "customer" ? "asp_customer_session=synthetic" : "asp_admin_session=" + tokens[role] } : {}),
        }, body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    };
    const results = [];
    const check = (name, actual, expected) => {
      assert.deepEqual(actual, expected, name);
      results.push({ test: name, result: "PASS" });
    };
    const fixtures = {};
    for (const kind of ["categories", "tags"]) {
      for (const role of [null, "customer", "order_manager"]) {
        for (const [method, suffix, body] of [
          ["GET", "", undefined], ["POST", "", { name: "Spoof", role: "super_admin", adminId: "other" }],
          ["PUT", "/missing", { name: "Spoof", role: "super_admin" }], ["PATCH", "/missing/archive", { role: "super_admin" }],
        ]) check(kind + " " + role + " " + method, (await request(kind, method, body, role, suffix)).status, role === "order_manager" ? 403 : 401);
      }
      for (const role of ["super_admin", "admin", "editor"]) {
        check(kind + " list " + role, (await request(kind, "GET", undefined, role)).status, 200);
        const created = await request(kind, "POST", { name: role + " Entry" }, role);
        check(kind + " create " + role, created.status, 201);
        check(kind + " update " + role, (await request(kind, "PUT", { name: "Updated", slug: created.body.slug, isActive: true }, role, "/" + created.body.id)).status, 200);
        check(kind + " archive " + role, (await request(kind, "PATCH", undefined, role, "/" + created.body.id + "/archive")).body.isActive, false);
      }
      for (const name of ["", " ", "A", "বাংলা সাহিত্য"]) {
        check(kind + " invalid/generated name " + name, (await request(kind, "POST", { name })).status, 400);
      }
      const bengali = await request(kind, "POST", { name: "বাংলা সাহিত্য", slug: "bangla-literature" });
      check(kind + " Bengali manual slug", bengali.status, 201);
      const long = await request(kind, "POST", { name: "A".repeat(1000), slug: "long-name" });
      check(kind + " existing unbounded name rule", long.status, 201);
      const created = await request(kind, "POST", { name: "  Science Fiction  ", description: "  Description  ", role: "super_admin", adminId: "other", isActive: false });
      check(kind + " create", created.status, 201);
      check(kind + " slug/active", [created.body.slug, created.body.isActive], ["science-fiction", true]);
      if (kind === "categories") check("description trim", created.body.description, "Description");
      fixtures[kind] = created.body;
      check(kind + " duplicate slug", (await request(kind, "POST", { name: "Other", slug: "science-fiction" })).status, 409);
      check(kind + " duplicate name distinct slug", (await request(kind, "POST", { name: "Science Fiction", slug: "another-fiction" })).status, 201);
      const race = await Promise.all([request(kind, "POST", { name: "Fiction" }), request(kind, "POST", { name: "Fiction" })]);
      check(kind + " concurrent duplicate", race.map(r => r.status).sort(), [201, 409]);
      check(kind + " canonical row", (await request(kind)).body.filter(r => r.slug === "fiction").length, 1);
      check(kind + " missing ID", (await request(kind, "PATCH", undefined, "editor", "/missing/archive")).status, 404);
      check(kind + " malformed ID", (await request(kind, "PATCH", undefined, "editor", "/bad%20id/archive")).status, 400);
      check(kind + " invalid slug", (await request(kind, "PUT", { name: "Valid", slug: "NOT VALID" }, "editor", "/" + created.body.id)).status, 400);
      check(kind + " update duplicate slug", (await request(kind, "PUT", { name: "Valid", slug: "fiction" }, "editor", "/" + created.body.id)).status, 409);
      check(kind + " no delete endpoint", (await request(kind, "DELETE", undefined, "editor", "/" + created.body.id)).status, 404);
      check(kind + " whitespace slug generation", (await request(kind, "POST", { name: "  History  " })).body.slug, "history");
    }
    const book = await prisma.client.book.create({ data: {
      title: "Taxonomy Fixture", slug: "taxonomy-fixture", author: "Test Author",
      regularPrice: 100, salePrice: 90, categoryId: fixtures.categories.id,
      tags: { create: { tagId: fixtures.tags.id } },
    } });
    for (const kind of ["categories", "tags"]) {
      const id = fixtures[kind].id;
      check(kind + " referenced archive", (await request(kind, "PATCH", undefined, "editor", "/" + id + "/archive")).body.isActive, false);
      check(kind + " count", (await request(kind)).body.find(r => r.id === id)._count.books, 1);
      const updated = await request(kind, "PUT", { name: "History", slug: "science-fiction", description: "", isActive: true }, "editor", "/" + id);
      check(kind + " rename/unarchive/stable manual slug", [updated.status, updated.body.slug, updated.body.isActive], [200, "science-fiction", true]);
      if (kind === "categories") check("description clear", updated.body.description, "");
    }
    const detail = await request("books", "GET", undefined, "editor", "/" + book.id);
    check("book detail relationships", [detail.status, detail.body.categoryId, detail.body.tags[0].tagId], [200, fixtures.categories.id, fixtures.tags.id]);
    await assert.rejects(prisma.client.bookTag.create({ data: { bookId: book.id, tagId: fixtures.tags.id } }));
    check("join uniqueness", await prisma.client.bookTag.count({ where: { bookId: book.id } }), 1);
    await assert.rejects(prisma.client.bookTag.create({ data: { bookId: book.id, tagId: "missing" } }));
    check("foreign keys", (await db.prepare("PRAGMA foreign_key_check").all()).results, []);
    const disposableCategory = await prisma.client.category.create({ data: { name: "Disposable", slug: "disposable" } });
    const disposableTag = await prisma.client.tag.create({ data: { name: "Disposable", slug: "disposable" } });
    const disposableBook = await prisma.client.book.create({ data: {
      title: "Disposable", slug: "disposable", author: "Test Author", regularPrice: 1, salePrice: 1,
      categoryId: disposableCategory.id, tags: { create: { tagId: disposableTag.id } },
    } });
    // Probe schema FK semantics using disposable local fixtures only; no API delete exists.
    await prisma.client.category.delete({ where: { id: disposableCategory.id } });
    check("category FK SET NULL", (await prisma.client.book.findUnique({ where: { id: disposableBook.id } })).categoryId, null);
    await prisma.client.tag.delete({ where: { id: disposableTag.id } });
    check("tag FK cascade", await prisma.client.bookTag.count({ where: { bookId: disposableBook.id } }), 0);
    console.log(JSON.stringify({ results, remoteD1Modified: false, fixtureBookId: book.id }, null, 2));
    if (process.argv.includes("--serve")) {
      console.log("LOCAL TAXONOMY HARNESS READY on 8790");
      await new Promise(resolve => { process.once("SIGINT", resolve); process.once("SIGTERM", resolve); });
    }
  } finally {
    if (app) await app.close();
    await platform.dispose();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
