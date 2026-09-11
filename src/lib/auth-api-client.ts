"use client";

import { apiFetch } from "@/lib/api-client";

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

async function requestAuth<T>(
  path: string,
  method: "POST" | "PUT",
  body: object,
): Promise<T> {
  const response = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as {
    message?: string | string[];
    fieldErrors?: Record<string, string>;
  } & T;

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message[0]
      : data.message;
    throw new AuthApiError(
      message || "The request could not be completed. Please try again.",
      response.status,
      data.fieldErrors,
    );
  }
  return data;
}

export function postAuth<T>(path: string, body: object): Promise<T> {
  return requestAuth(path, "POST", body);
}

export function putAuth<T>(path: string, body: object): Promise<T> {
  return requestAuth(path, "PUT", body);
}
