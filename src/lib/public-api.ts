import "server-only";

function apiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000"
  ).replace(/\/+$/, "");
}

/** Server-component transport for public NestJS reads. */
export async function fetchPublicApi<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Public API request failed: ${response.status}`);
  return response.json() as Promise<T>;
}
