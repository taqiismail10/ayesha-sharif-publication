-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('draft', 'published');

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publishedTitle" TEXT,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "publishedContent" TEXT,
    "status" "PolicyStatus" NOT NULL DEFAULT 'draft',
    "updatedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Policy_slug_key" ON "Policy"("slug");

-- CreateIndex
CREATE INDEX "Policy_status_idx" ON "Policy"("status");

-- CreateIndex
CREATE INDEX "Policy_updatedById_idx" ON "Policy"("updatedById");

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
