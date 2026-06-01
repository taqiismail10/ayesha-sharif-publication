export function hasUsableDatabaseUrl() {
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
