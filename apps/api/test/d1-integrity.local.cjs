/* eslint-disable @typescript-eslint/no-require-imports -- This local harness loads the compiled CommonJS API and Node-only test tooling. */
/* Local-only D1 integrity regression harness. Run after `npm run build`. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { getPlatformProxy, unstable_splitSqlQuery } = require("wrangler");
const { PrismaService } = require("../dist/prisma/prisma.service.js");
const { D1AtomicService } = require("../dist/prisma/d1-atomic.service.js");

const now = () => new Date().toISOString().replace("Z", "+00:00");
const future = () => new Date(Date.now() + 600_000).toISOString().replace("Z", "+00:00");

async function main() {
  const platform = await getPlatformProxy({
    configPath: path.resolve(__dirname, "../wrangler.jsonc"),
    envFiles: [],
    persist: false,
    remoteBindings: false,
  });
  const db = platform.env.asp_db;
  const migration = fs.readFileSync(
    path.resolve(__dirname, "../../../prisma/migrations/0001_init.sql"),
    "utf8",
  );
  for (const statement of unstable_splitSqlQuery(migration)) {
    if (statement.trim()) await db.prepare(statement).run();
  }

  const prisma = new PrismaService();
  prisma.bind(db);
  const atomic = new D1AtomicService(prisma);
  const results = {};
  const run = (sql, ...values) => db.prepare(sql).bind(...values).run();
  const first = (sql, ...values) => db.prepare(sql).bind(...values).first();

  const addCustomer = async (id, email, passwordHash = "old-hash") => {
    const stamp = now();
    await run(
      `INSERT INTO Customer (id,name,email,passwordHash,passwordLoginEnabled,emailVerifiedAt,isActive,createdAt,updatedAt)
       VALUES (?, ?, ?, ?, 1, ?, 1, ?, ?)`,
      id, id, email, passwordHash, stamp, stamp, stamp,
    );
  };
  const addBook = async (id) => {
    const stamp = now();
    await run(
      `INSERT INTO Book (id,title,slug,author,regularPrice,salePrice,stockQuantity,status,createdAt,updatedAt)
       VALUES (?, ?, ?, 'Author', 100, 90, 100, 'published', ?, ?)`,
      id, id, id, stamp, stamp,
    );
  };
  const order = (id, orderNumber, itemCount, invalidLast = false) => ({
    id, orderNumber, customerId: null, customerName: "Test Customer",
    customerPhone: "01700000000", customerEmail: "order@test.invalid",
    shippingAddress: "Test address long enough", district: "Dhaka",
    deliveryArea: "inside_dhaka", subtotal: itemCount * 100,
    discountTotal: itemCount * 10, deliveryCharge: 70,
    grandTotal: itemCount * 90 + 70, paymentMethod: "cash_on_delivery",
    paymentStatus: "unpaid", transactionId: null, notes: null,
    items: Array.from({ length: itemCount }, (_, index) => ({
      id: `${id}-item-${index}`, bookId: invalidLast && index === itemCount - 1 ? "missing-book" : `book-${index}`,
      bookTitleSnapshot: `Book ${index}`, quantity: 1, unitPrice: 90, totalPrice: 90,
    })),
  });

  try {
    results.foreignKeys = (await first("PRAGMA foreign_keys")).foreign_keys;
    assert.equal(results.foreignKeys, 1);

    for (let i = 0; i < 10; i += 1) await addBook(`book-${i}`);
    for (const count of [1, 2, 10]) {
      await atomic.createOrder(order(`order-${count}`, `TEST9-${count}`, count));
      const row = await first("SELECT COUNT(*) count FROM OrderItem WHERE orderId = ?", `order-${count}`);
      assert.equal(row.count, count);
      results[`order${count}`] = row.count;
    }
    await assert.rejects(atomic.createOrder(order("order-fail", "TEST9-FAIL", 2, true)));
    assert.equal((await first('SELECT COUNT(*) count FROM "Order" WHERE id = ?', "order-fail")).count, 0);
    assert.equal((await first("SELECT COUNT(*) count FROM OrderItem WHERE orderId = ?", "order-fail")).count, 0);
    results.orderRollback = "0 parent / 0 children";

    const duplicateAttempts = await Promise.allSettled([
      atomic.createOrder(order("order-dup-a", "TEST9-DUP", 1)),
      atomic.createOrder(order("order-dup-b", "TEST9-DUP", 1)),
    ]);
    assert.equal(duplicateAttempts.filter((item) => item.status === "fulfilled").length, 1);
    assert.equal((await first('SELECT COUNT(*) count FROM "Order" WHERE orderNumber = ?', "TEST9-DUP")).count, 1);
    results.duplicateOrder = "1 success / 1 rejected / 1 row";

    await addCustomer("profile-customer", "profile@test.invalid");
    await db.prepare(`CREATE TRIGGER fail_profile_preference BEFORE INSERT ON CustomerPreference
      BEGIN SELECT RAISE(ABORT, 'injected profile failure'); END`).run();
    await assert.rejects(atomic.updateProfile({
      customerId: "profile-customer", displayName: "Changed Name", email: "changed@test.invalid", phone: null,
      defaultDistrict: null, defaultDeliveryArea: null, defaultAddress: null,
      marketingConsent: true, personalizationConsent: true,
      preferredCategories: ["x"], preferredTags: [], preferredLanguages: [],
    }));
    assert.equal((await first("SELECT name FROM Customer WHERE id = 'profile-customer'")).name, "profile-customer");
    assert.equal((await first("SELECT COUNT(*) count FROM CustomerProfile WHERE customerId = 'profile-customer'")).count, 0);
    results.profileRollback = "customer unchanged / 0 profile / 0 preference";
    await db.exec("DROP TRIGGER fail_profile_preference;");

    await addCustomer("reset-customer", "reset@test.invalid");
    let stamp = now();
    await run(`INSERT INTO PasswordResetToken (id,email,tokenHash,expiresAt,createdAt,updatedAt)
      VALUES ('reset-token','reset@test.invalid','expected-reset',?,?,?)`, future(), stamp, stamp);
    await run(`INSERT INTO CustomerSession (id,customerId,tokenHash,expiresAt,createdAt)
      VALUES ('reset-session','reset-customer','session-hash',?,?)`, future(), stamp);
    const resetAttempts = await Promise.all([
      atomic.resetPassword({ resetId: "reset-token", expectedTokenHash: "expected-reset", customerId: "reset-customer", email: "reset@test.invalid", passwordHash: "new-a", verifyEmail: false }),
      atomic.resetPassword({ resetId: "reset-token", expectedTokenHash: "expected-reset", customerId: "reset-customer", email: "reset@test.invalid", passwordHash: "new-b", verifyEmail: false }),
    ]);
    assert.deepEqual([...resetAttempts].sort(), [false, true]);
    assert.equal((await first("SELECT COUNT(*) count FROM CustomerSession WHERE customerId = 'reset-customer'")).count, 0);
    assert.ok(["new-a", "new-b"].includes((await first("SELECT passwordHash FROM Customer WHERE id = 'reset-customer'")).passwordHash));
    results.passwordResetRace = "1 success / 1 rejected / sessions revoked";

    await addCustomer("reset-fail-customer", "reset-fail@test.invalid");
    stamp = now();
    await run(`INSERT INTO PasswordResetToken (id,email,tokenHash,expiresAt,createdAt,updatedAt)
      VALUES ('reset-fail-token','reset-fail@test.invalid','reset-fail-hash',?,?,?)`, future(), stamp, stamp);
    await run(`INSERT INTO CustomerSession (id,customerId,tokenHash,expiresAt,createdAt)
      VALUES ('reset-fail-session','reset-fail-customer','reset-fail-session-hash',?,?)`, future(), stamp);
    await db.prepare(`CREATE TRIGGER fail_reset_session_delete BEFORE DELETE ON CustomerSession
      WHEN OLD.customerId = 'reset-fail-customer' BEGIN SELECT RAISE(ABORT, 'injected reset failure'); END`).run();
    await assert.rejects(atomic.resetPassword({ resetId: "reset-fail-token", expectedTokenHash: "reset-fail-hash", customerId: "reset-fail-customer", email: "reset-fail@test.invalid", passwordHash: "should-rollback", verifyEmail: false }));
    assert.equal((await first("SELECT passwordHash FROM Customer WHERE id = 'reset-fail-customer'")).passwordHash, "old-hash");
    assert.equal((await first("SELECT consumedAt FROM PasswordResetToken WHERE id = 'reset-fail-token'")).consumedAt, null);
    assert.equal((await first("SELECT COUNT(*) count FROM CustomerSession WHERE customerId = 'reset-fail-customer'")).count, 1);
    results.passwordResetRollback = "token/password/session all unchanged";
    await db.exec("DROP TRIGGER fail_reset_session_delete;");

    await addCustomer("otp-customer", "otp@test.invalid");
    stamp = now();
    await run(`INSERT INTO OtpVerification (id,email,otpHash,purpose,attempts,expiresAt,resendAfter,createdAt,updatedAt)
      VALUES ('otp-signup','otp@test.invalid','otp-expected','SIGNUP',0,?,?,?,?)`, future(), stamp, stamp, stamp);
    const otpAttempts = await Promise.all([
      atomic.consumeSignupOtp({ otpId: "otp-signup", expectedOtpHash: "otp-expected", customerId: "otp-customer", email: "otp@test.invalid" }),
      atomic.consumeSignupOtp({ otpId: "otp-signup", expectedOtpHash: "otp-expected", customerId: "otp-customer", email: "otp@test.invalid" }),
    ]);
    assert.deepEqual([...otpAttempts].sort(), [false, true]);
    assert.notEqual((await first("SELECT emailVerifiedAt FROM Customer WHERE id = 'otp-customer'")).emailVerifiedAt, null);
    results.signupOtpRace = "1 success / 1 rejected / customer verified";

    await addCustomer("otp-reset-customer", "otp-reset@test.invalid");
    stamp = now();
    await run(`INSERT INTO OtpVerification (id,email,otpHash,purpose,attempts,expiresAt,resendAfter,createdAt,updatedAt)
      VALUES ('otp-reset','otp-reset@test.invalid','otp-reset-hash','PASSWORD_RESET',0,?,?,?,?)`, future(), stamp, stamp, stamp);
    const otpResetAttempts = await Promise.all([
      atomic.consumeOtpAndIssueReset({ otpId: "otp-reset", expectedOtpHash: "otp-reset-hash", email: "otp-reset@test.invalid", customerId: "otp-reset-customer", resetId: "issued-a", resetTokenHash: "issued-hash-a", resetExpiresAt: new Date(Date.now() + 600000) }),
      atomic.consumeOtpAndIssueReset({ otpId: "otp-reset", expectedOtpHash: "otp-reset-hash", email: "otp-reset@test.invalid", customerId: "otp-reset-customer", resetId: "issued-b", resetTokenHash: "issued-hash-b", resetExpiresAt: new Date(Date.now() + 600000) }),
    ]);
    assert.deepEqual([...otpResetAttempts].sort(), [false, true]);
    assert.equal((await first("SELECT COUNT(*) count FROM PasswordResetToken WHERE email = 'otp-reset@test.invalid'")).count, 1);
    results.resetOtpRace = "1 success / 1 rejected / 1 reset token";

    await addCustomer("oauth-existing", "oauth-existing@test.invalid");
    await atomic.linkGoogleCustomer({ providerId: "provider-existing", customerId: "oauth-existing", providerUserId: "google-existing", providerEmail: "oauth-existing@test.invalid" });
    assert.equal((await first("SELECT COUNT(*) count FROM CustomerAuthProvider WHERE customerId = 'oauth-existing'")).count, 1);
    assert.notEqual((await first("SELECT emailVerifiedAt FROM Customer WHERE id = 'oauth-existing'")).emailVerifiedAt, null);
    results.oauthExisting = "1 provider / verified";

    await db.prepare(`CREATE TRIGGER fail_oauth_provider BEFORE INSERT ON CustomerAuthProvider
      WHEN NEW.providerUserId = 'google-fail' BEGIN SELECT RAISE(ABORT, 'injected oauth failure'); END`).run();
    await assert.rejects(atomic.createGoogleCustomer({
      customer: { id: "oauth-fail", name: "OAuth Fail", email: "oauth-fail@test.invalid", passwordHash: "unused", passwordLoginEnabled: false, emailVerifiedAt: new Date() },
      displayName: "OAuth Fail", providerId: "provider-fail", providerUserId: "google-fail", providerEmail: "oauth-fail@test.invalid",
    }));
    assert.equal((await first("SELECT COUNT(*) count FROM Customer WHERE id = 'oauth-fail'")).count, 0);
    assert.equal((await first("SELECT COUNT(*) count FROM CustomerProfile WHERE customerId = 'oauth-fail'")).count, 0);
    results.oauthRollback = "0 customer / 0 profile / 0 preference / 0 provider";
    await db.exec("DROP TRIGGER fail_oauth_provider;");

    const oauthAttempts = await Promise.allSettled([
      atomic.createGoogleCustomer({ customer: { id: "oauth-a", name: "OAuth", email: "oauth-race@test.invalid", passwordHash: "unused", passwordLoginEnabled: false, emailVerifiedAt: new Date() }, displayName: "OAuth", providerId: "provider-a", providerUserId: "google-race", providerEmail: "oauth-race@test.invalid" }),
      atomic.createGoogleCustomer({ customer: { id: "oauth-b", name: "OAuth", email: "oauth-race@test.invalid", passwordHash: "unused", passwordLoginEnabled: false, emailVerifiedAt: new Date() }, displayName: "OAuth", providerId: "provider-b", providerUserId: "google-race", providerEmail: "oauth-race@test.invalid" }),
    ]);
    assert.equal(oauthAttempts.filter((item) => item.status === "fulfilled").length, 1);
    assert.equal((await first("SELECT COUNT(*) count FROM Customer WHERE email = 'oauth-race@test.invalid'")).count, 1);
    assert.equal((await first("SELECT COUNT(*) count FROM CustomerAuthProvider WHERE providerUserId = 'google-race'")).count, 1);
    results.oauthRace = "1 atomic account / 1 provider";

    await db.prepare(`CREATE TRIGGER fail_signup_preference BEFORE INSERT ON CustomerPreference
      WHEN NEW.customerId = 'signup-fail' BEGIN SELECT RAISE(ABORT, 'injected signup failure'); END`).run();
    await assert.rejects(atomic.upsertSignupCustomer({ id: "signup-fail", name: "Signup", email: "signup-fail@test.invalid", passwordHash: "hash", passwordLoginEnabled: true, emailVerifiedAt: null }));
    assert.equal((await first("SELECT COUNT(*) count FROM Customer WHERE id = 'signup-fail'")).count, 0);
    results.signupRollback = "0 customer / 0 profile / 0 preference";
    await db.exec("DROP TRIGGER fail_signup_preference;");

    console.log(JSON.stringify(results, null, 2));
  } finally {
    await platform.dispose();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
