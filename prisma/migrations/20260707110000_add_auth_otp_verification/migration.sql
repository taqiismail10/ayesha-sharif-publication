-- Existing customers predate mandatory email OTP verification. Backfill them
-- as verified so this migration does not lock out current password users.
ALTER TABLE "Customer"
ADD COLUMN "passwordLoginEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

UPDATE "Customer"
SET "emailVerifiedAt" = CURRENT_TIMESTAMP
WHERE "email" IS NOT NULL;

CREATE TYPE "OtpPurpose" AS ENUM ('SIGNUP', 'PASSWORD_RESET');

CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "resendAfter" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OtpVerification_email_purpose_key"
ON "OtpVerification"("email", "purpose");

CREATE INDEX "OtpVerification_expiresAt_idx"
ON "OtpVerification"("expiresAt");

CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_email_key"
ON "PasswordResetToken"("email");

CREATE INDEX "PasswordResetToken_expiresAt_idx"
ON "PasswordResetToken"("expiresAt");
