/* eslint-disable @typescript-eslint/no-require-imports -- isolated local Worker/D1 contract test. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const compilerRoot = path.resolve(__dirname, "../src/generated/prisma/internal");
require("node:module").registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "./query_compiler_fast_bg.js") {
      return {
        url: pathToFileURL(path.join(compilerRoot, "query_compiler_fast_bg.js")).href,
        shortCircuit: true,
      };
    }
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
  const platform = await getPlatformProxy({
    configPath: path.resolve(__dirname, "../wrangler.jsonc"),
    envFiles: [],
    persist: false,
    remoteBindings: false,
  });
  let app;
  try {
    const sql = fs.readFileSync(path.resolve(__dirname, "../../../prisma/migrations/0001_init.sql"), "utf8");
    for (const statement of unstable_splitSqlQuery(sql)) {
      if (statement.trim()) await platform.env.asp_db.prepare(statement).run();
    }

    app = await NestFactory.create(AppModule, { logger: ["error", "warn"] });
    const prisma = app.get(PrismaService);
    prisma.bind(platform.env.asp_db);
    configureApplication(app);

    const category = await prisma.client.category.create({
      data: { name: "Confirmation tests", slug: "confirmation-tests" },
    });
    const book = await prisma.client.book.create({
      data: {
        title: "A safe confirmation", slug: "a-safe-confirmation", author: "Author",
        categoryId: category.id, regularPrice: 500, salePrice: 450,
        stockQuantity: 10, status: "published",
      },
    });
    await prisma.client.order.create({
      data: {
        orderNumber: "ASP-260914-1234",
        customerName: "Private Reader",
        customerPhone: "01700000000",
        customerEmail: "private@example.test",
        shippingAddress: "Private address", district: "Dhaka", deliveryArea: "inside_dhaka",
        subtotal: 500, discountTotal: 50, deliveryCharge: 60, grandTotal: 510,
        paymentMethod: "bkash", paymentStatus: "paid", orderStatus: "confirmed",
        transactionId: "private-transaction", notes: "private note", adminNote: "private admin note",
        items: { create: [{ bookId: book.id, bookTitleSnapshot: book.title, quantity: 1, unitPrice: 450, totalPrice: 450 }] },
      },
    });
    await app.listen(8796, "127.0.0.1");

    const request = async (requestPath) => {
      const response = await fetch(`http://127.0.0.1:8796${requestPath}`);
      const body = await response.json();
      return {
        status: response.status,
        body,
        cacheControl: response.headers.get("cache-control"),
      };
    };
    const checks = [];
    const check = (name, actual, expected) => {
      assert.deepEqual(actual, expected, name);
      checks.push(name);
    };

    const valid = await request("/orders/confirmation/ASP-260914-1234");
    check("guest confirmation status", valid.status, 200);
    check(
      "confirmation disables shared caching",
      valid.cacheControl,
      "private, no-store, max-age=0, must-revalidate",
    );
    check("confirmation-safe contract", valid.body, {
      orderNumber: "ASP-260914-1234",
      createdAt: valid.body.createdAt,
      paymentMethod: "bkash",
      paymentStatus: "paid",
      orderStatus: "confirmed",
      items: [{ title: "A safe confirmation", quantity: 1, price: 450 }],
      totals: { subtotal: 500, discount: 50, delivery: 60, grandTotal: 510 },
    });
    check("createdAt serializes as ISO", Number.isNaN(Date.parse(valid.body.createdAt)), false);
    for (const field of [
      "id", "customerId", "customerName", "customerPhone", "customerEmail",
      "shippingAddress", "district", "deliveryArea", "transactionId", "notes", "adminNote",
    ]) {
      check(`does not expose ${field}`, Object.hasOwn(valid.body, field), false);
    }
    for (const field of ["id", "orderId", "bookId", "unitPrice"]) {
      check(`item does not expose ${field}`, Object.hasOwn(valid.body.items[0], field), false);
    }
    check("unknown confirmation", (await request("/orders/confirmation/ASP-260914-9999")).status, 404);
    check("invalid confirmation", (await request("/orders/confirmation/not%20valid")).status, 400);
    check("missing confirmation", (await request("/orders/confirmation")).status, 400);
    check("long confirmation", (await request(`/orders/confirmation/${"A".repeat(65)}`)).status, 400);

    console.log(`PASS ${checks.length} local D1 public order confirmation assertions`);
  } finally {
    if (app) await app.close();
    await platform.dispose();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
