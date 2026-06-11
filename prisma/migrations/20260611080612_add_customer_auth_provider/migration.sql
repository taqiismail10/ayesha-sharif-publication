-- CreateTable
CREATE TABLE "CustomerAuthProvider" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAuthProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerAuthProvider_providerEmail_idx" ON "CustomerAuthProvider"("providerEmail");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAuthProvider_provider_providerUserId_key" ON "CustomerAuthProvider"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAuthProvider_customerId_provider_key" ON "CustomerAuthProvider"("customerId", "provider");

-- AddForeignKey
ALTER TABLE "CustomerAuthProvider" ADD CONSTRAINT "CustomerAuthProvider_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
