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

const anonymousId = "anonymous_recommendation_test_1234";
const token = "local-customer-session-token";
const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

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

    const category = await prisma.client.category.create({ data: { name: "Recommendation category", slug: "recommendation-category" } });
    const tag = await prisma.client.tag.create({ data: { name: "Recommendation tag", slug: "recommendation-tag" } });
    const source = await prisma.client.book.create({ data: { title: "Source", slug: "recommendation-source", author: "Shared Author", language: "Bangla", categoryId: category.id, regularPrice: 500, salePrice: 450, stockQuantity: 3, status: "published", tags: { create: { tagId: tag.id } } } });
    const candidate = await prisma.client.book.create({ data: { title: "Candidate", slug: "recommendation-candidate", author: "Shared Author", language: "Bangla", categoryId: category.id, regularPrice: 600, salePrice: 500, stockQuantity: 3, status: "published", tags: { create: { tagId: tag.id } } } });
    const fallback = await prisma.client.book.create({ data: { title: "Fallback", slug: "recommendation-fallback", author: "Other", language: "English", regularPrice: 300, salePrice: 300, stockQuantity: 3, status: "published", isBestSeller: true } });
    const customer = await prisma.client.customer.create({ data: { name: "Recommendation reader", email: "recommendations@example.test", passwordHash: "not-used", emailVerifiedAt: new Date(), profile: { create: { personalizationConsent: true } }, preferences: { create: { preferredCategories: [category.id], preferredTags: [tag.id], preferredLanguages: ["Bangla"] } } } });
    await prisma.client.customerSession.create({ data: { customerId: customer.id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
    await prisma.client.order.create({ data: { orderNumber: "ASP-REC-0001", customerId: customer.id, customerName: customer.name, customerPhone: "01700000000", shippingAddress: "Address", district: "Dhaka", deliveryArea: "inside_dhaka", subtotal: 450, discountTotal: 50, deliveryCharge: 60, grandTotal: 510, paymentMethod: "bkash", paymentStatus: "paid", orderStatus: "confirmed", items: { create: [{ bookId: source.id, bookTitleSnapshot: source.title, quantity: 1, unitPrice: 450, totalPrice: 450 }] } } });
    const consentOff = await prisma.client.customer.create({ data: { name: "Consent off", email: "consent-off@example.test", passwordHash: "not-used", emailVerifiedAt: new Date(), profile: { create: { personalizationConsent: false } } } });
    const offToken = "local-consent-off-session";
    await prisma.client.customerSession.create({ data: { customerId: consentOff.id, tokenHash: crypto.createHash("sha256").update(offToken).digest("hex"), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
    await app.listen(8797, "127.0.0.1");

    const request = async (requestPath, init = {}) => {
      const response = await fetch(`http://127.0.0.1:8797${requestPath}`, init);
      return { status: response.status, body: await response.json() };
    };
    const checks = [];
    const check = (name, actual, expected) => { assert.deepEqual(actual, expected, name); checks.push(name); };
    const contains = (name, books, id) => { assert.equal(books.some((book) => book.id === id), true, name); checks.push(name); };

    const similar = await request(`/books/${source.id}/recommendations?take=4`);
    check("similar status", similar.status, 200);
    contains("similar uses shared signals", similar.body.books, candidate.id);
    check("similar excludes source", similar.body.books.some((book) => book.id === source.id), false);
    check("similar cap validation", (await request(`/books/${source.id}/recommendations?take=13`)).status, 400);

    const anonymousEvent = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId: source.id, eventType: "view", anonymousId, source: "test" }) };
    check("anonymous view tracked", (await request("/recommendations/events", anonymousEvent)).body, { ok: true, tracked: true });
    check("anonymous view deduplicated", (await request("/recommendations/events", anonymousEvent)).body, { ok: true, tracked: false });
    const concurrentAnonymousId = "concurrent_recommendation_test_1234";
    const concurrentEvent = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: source.id, eventType: "view", anonymousId: concurrentAnonymousId }),
    };
    const concurrentResults = await Promise.all([
      request("/recommendations/events", concurrentEvent),
      request("/recommendations/events", concurrentEvent),
    ]);
    check("concurrent views remain safe responses", concurrentResults.map((result) => result.status), [200, 200]);
    const concurrentCount = await prisma.client.customerBookEvent.count({
      where: { bookId: source.id, eventType: "view", anonymousId: concurrentAnonymousId },
    });
    check("concurrent view dedupe has no corrupted state", concurrentCount >= 1 && concurrentCount <= 2, true);
    check("unknown event rejected", (await request("/recommendations/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId: source.id, eventType: "unknown", anonymousId }) })).status, 400);
    check("anonymous missing id is not tracked", (await request("/recommendations/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId: source.id, eventType: "add_to_cart" }) })).body, { ok: true, tracked: false });
    const anonymousRecommendations = await request(`/recommendations?anonymousId=${anonymousId}`);
    contains("anonymous history drives ranking", anonymousRecommendations.body.books, candidate.id);
    check("anonymous source excluded", anonymousRecommendations.body.books.some((book) => book.id === source.id), false);

    const customerRecommendations = await request("/recommendations", { headers: { cookie: `asp_customer_session=${token}` } });
    contains("customer order and preference history drive ranking", customerRecommendations.body.books, candidate.id);
    const spoofedIdentityEvent = await request("/recommendations/events", { method: "POST", headers: { "Content-Type": "application/json", cookie: `asp_customer_session=${token}` }, body: JSON.stringify({ bookId: candidate.id, eventType: "add_to_cart", customerId: "attacker-id" }) });
    check("client customerId cannot select event identity", spoofedIdentityEvent.body, { ok: true, tracked: true });
    const recorded = await prisma.client.customerBookEvent.findFirst({ where: { bookId: candidate.id, eventType: "add_to_cart" } });
    check("event identity comes from session", recorded.customerId, customer.id);
    const off = await request("/recommendations/events", { method: "POST", headers: { "Content-Type": "application/json", cookie: `asp_customer_session=${offToken}` }, body: JSON.stringify({ bookId: source.id, eventType: "add_to_cart", anonymousId }) });
    check("consent-off customer is not tracked", off.body, { ok: true, tracked: false });
    check("fallback response remains available", (await request("/recommendations")).body.books[0].id, fallback.id);

    console.log(`PASS ${checks.length} local D1 recommendation assertions (concurrent view rows: ${concurrentCount})`);
  } finally {
    if (app) await app.close();
    await platform.dispose();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
