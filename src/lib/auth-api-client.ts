"use client";

import { apiFetch } from "@/lib/api-client";

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function postAuth<T>(path: string, body: object): Promise<T> {
  const response = await apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as {
    message?: string | string[];
  } & T;

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message[0]
      : data.message;
    throw new AuthApiError(
      message || "The request could not be completed. Please try again.",
      response.status,
    );
  }
  return data;
}
