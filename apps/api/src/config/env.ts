/**
 * Environment helpers — mirrors src/lib/env.ts from the Next.js app so both
 * backends judge "is the database configured" identically during migration.
 */
export function hasUsableDatabaseUrl(): boolean {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return false;

  try {
    const parsed = new URL(databaseUrl);
    return (
      ["postgresql:", "postgres:"].includes(parsed.protocol) &&
      Boolean(parsed.hostname) &&
      Boolean(parsed.pathname.replace("/", ""))
    );
  } catch {
    return false;
  }
}
