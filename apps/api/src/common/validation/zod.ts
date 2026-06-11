import { BadRequestException } from "@nestjs/common";
import type { ZodSchema } from "zod";

/**
 * Parses a request body with a Zod schema. On failure throws 400 with the
 * FIRST issue message — mirroring the old server actions, which surfaced
 * `parsed.error.issues[0]?.message` to the user.
 */
export function parseOrThrow<T>(schema: ZodSchema<T>, body: unknown, fallback: string): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException(
      parsed.error.issues[0]?.message || fallback,
    );
  }
  return parsed.data;
}
