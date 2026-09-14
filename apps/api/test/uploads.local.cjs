/* eslint-disable @typescript-eslint/no-require-imports -- local-only Worker integration harness. */
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const compilerRoot = path.resolve(__dirname, "../src/generated/prisma/internal");
require("node:module").registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "./query_compiler_fast_bg.js") {
      return { url: pathToFileURL(path.join(compilerRoot, "query_compiler_fast_bg.js")).href, shortCircuit: true };
    }
    if (specifier === "./query_compiler_fast_bg.wasm?module") {
      const file = path.join(compilerRoot, "query_compiler_fast_bg.wasm");
      const source = `import fs from 'node:fs'; export default new WebAssembly.Module(fs.readFileSync(${JSON.stringify(file)}));`;
      return { url: `data:text/javascript,${encodeURIComponent(source)}`, shortCircuit: true };
    }
    return next(specifier, context);
  },
});

const { getPlatformProxy, unstable_splitSqlQuery } = require("wrangler");
const { Module } = require("@nestjs/common");
const { NestFactory } = require("@nestjs/core");
const { AdminModule } = require("../dist/admin/admin.module");
const { PrismaModule } = require("../dist/prisma/prisma.module");
const { PrismaService } = require("../dist/prisma/prisma.service");
const { UploadsModule } = require("../dist/uploads/uploads.module");
const { configureApplication } = require("../dist/bootstrap");

const signatures = {
  "image/jpeg": Uint8Array.from([0xff, 0xd8, 0xff, 0x00]),
  "image/png": Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/webp": Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
  "application/pdf": Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]),
};

async function main() {
  const platform = await getPlatformProxy({
    configPath: path.resolve(__dirname, "../wrangler.jsonc"),
    envFiles: [],
    persist: false,
    remoteBindings: false,
  });
  const db = platform.env.asp_db;
  const storage = platform.env.ASP_STORAGE;
  let app;

  try {
    for (const file of ["0001_init.sql", "20260911090000_add_admin_sessions/migration.sql"]) {
      const sql = fs.readFileSync(path.resolve(__dirname, "../../../prisma/migrations", file), "utf8");
      for (const statement of unstable_splitSqlQuery(sql)) if (statement.trim()) await db.prepare(statement).run();
    }

    class TestModule {}
    Module({ imports: [PrismaModule, AdminModule, UploadsModule] })(TestModule);
    app = await NestFactory.create(TestModule, { logger: false });
    const prisma = app.get(PrismaService);
    prisma.bind(db);
    app.get(require("../dist/uploads/uploads.service").UploadsService).bind(storage);
    configureApplication(app);

    const tokens = {};
    for (const role of ["super_admin", "admin", "editor", "order_manager"]) {
      const admin = await prisma.client.admin.create({
        data: { name: role, email: `${role}@test.invalid`, passwordHash: crypto.randomBytes(32).toString("hex"), role },
      });
      tokens[role] = crypto.randomBytes(32).toString("hex");
      await prisma.client.adminSession.create({
        data: { adminId: admin.id, tokenHash: crypto.createHash("sha256").update(tokens[role]).digest("hex"), expiresAt: new Date(Date.now() + 3_600_000) },
      });
    }

    await app.listen(8791, "127.0.0.1");
    const results = [];
    const check = (name, actual, expected) => {
      assert.equal(actual, expected, name);
      results.push(name);
    };
    const request = async ({ role, type, mime, filename, bytes, size }) => {
      const form = new FormData();
      if (mime) form.append("file", new Blob([bytes], { type: mime }), filename);
      if (type !== undefined) form.append("type", type);
      const response = await fetch("http://127.0.0.1:8791/admin/uploads", {
        method: "POST",
        headers: role ? { cookie: role === "customer" ? "asp_customer_session=synthetic" : `asp_admin_session=${tokens[role]}` } : {},
        body: form,
      });
      return { response, body: await response.json(), expectedSize: size ?? bytes?.byteLength ?? 0 };
    };

    check("no session", (await request({ type: "cover", mime: "image/png", filename: "book.png", bytes: signatures["image/png"] })).response.status, 401);
    check("customer session", (await request({ role: "customer", type: "cover", mime: "image/png", filename: "book.png", bytes: signatures["image/png"] })).response.status, 401);

    for (const role of ["super_admin", "admin", "editor", "order_manager"]) {
      const result = await request({ role, type: "cover", mime: "image/jpeg", filename: "cover.jpg", bytes: signatures["image/jpeg"] });
      check(`${role} legacy upload permission`, result.response.status, 201);
    }

    for (const [type, mime, filename] of [["cover", "image/png", "cover.png"], ["gallery", "image/webp", "gallery.webp"], ["sample", "application/pdf", "sample.pdf"]]) {
      const result = await request({ role: "admin", type, mime, filename, bytes: signatures[mime] });
      check(`${mime} accepted`, result.response.status, 201);
      check(`${mime} generated key`, /^books\/(images|samples)\/[0-9a-f-]+\.(jpg|png|webp|pdf)$/i.test(result.body.key), true);
      const object = await storage.get(result.body.key);
      check(`${mime} stored`, Boolean(object), true);
      check(`${mime} content type`, object.httpMetadata.contentType, mime);
      check(`${mime} byte size`, (await new Response(object.body).arrayBuffer()).byteLength, result.expectedSize);
    }

    check("HTML rejected", (await request({ role: "admin", type: "cover", mime: "text/html", filename: "bad.html", bytes: Uint8Array.from([60, 104, 116, 109, 108, 62]) })).response.status, 400);
    check("SVG rejected", (await request({ role: "admin", type: "cover", mime: "image/svg+xml", filename: "bad.svg", bytes: Uint8Array.from([60, 115, 118, 103, 62]) })).response.status, 400);
    check("mismatched extension rejected", (await request({ role: "admin", type: "cover", mime: "image/png", filename: "bad.html", bytes: signatures["image/png"] })).response.status, 400);
    check("mismatched bytes rejected", (await request({ role: "admin", type: "cover", mime: "image/png", filename: "bad.png", bytes: Uint8Array.from([1, 2, 3]) })).response.status, 400);
    check("empty upload rejected", (await request({ role: "admin", type: "cover", mime: "image/png", filename: "empty.png", bytes: new Uint8Array() })).response.status, 400);
    const oversizedImage = new Uint8Array(5 * 1024 * 1024 + 1);
    oversizedImage.set(signatures["image/png"]);
    check("oversized image rejected", (await request({ role: "admin", type: "cover", mime: "image/png", filename: "large.png", bytes: oversizedImage })).response.status, 400);
    check("PDF outside sample rejected", (await request({ role: "admin", type: "cover", mime: "application/pdf", filename: "cover.pdf", bytes: signatures["application/pdf"] })).response.status, 400);
    check("path-like filename gets generated key", /^books\/images\/[0-9a-f-]+\.png$/i.test((await request({ role: "admin", type: "cover", mime: "image/png", filename: "../../evil.png", bytes: signatures["image/png"] })).body.key), true);

    console.log(`PASS ${results.length} local D1/R2 upload assertions`);
  } finally {
    if (app) await app.close();
    await platform.dispose();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
