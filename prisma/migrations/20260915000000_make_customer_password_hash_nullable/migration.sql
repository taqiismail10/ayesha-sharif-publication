-- D1/SQLite cannot relax a NOT NULL constraint in place. Rebuild Customer
-- while deferred foreign keys allow its dependent tables to keep pointing to
-- the final Customer table. Wrangler D1 migrations do not permit BEGIN/COMMIT
-- statements; the deployment migration runner owns the statement lifecycle.
PRAGMA defer_foreign_keys = ON;

CREATE TABLE "Customer_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "passwordLoginEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifiedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "Customer_new" (
    "id", "name", "email", "phone", "passwordHash",
    "passwordLoginEnabled", "emailVerifiedAt", "isActive", "lastLoginAt",
    "createdAt", "updatedAt"
)
SELECT
    "id", "name", "email", "phone", "passwordHash",
    "passwordLoginEnabled", "emailVerifiedAt", "isActive", "lastLoginAt",
    "createdAt", "updatedAt"
FROM "Customer";

DROP TABLE "Customer";
ALTER TABLE "Customer_new" RENAME TO "Customer";

CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
CREATE INDEX "Customer_email_idx" ON "Customer"("email");
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");
