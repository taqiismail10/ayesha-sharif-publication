import { Injectable } from "@nestjs/common";
import {
  argon2id,
  argon2Verify,
  setWASMModules,
} from "argon2-wasm-edge";
import argon2WASM from "argon2-wasm-edge/wasm/argon2.wasm";
import blake2bWASM from "argon2-wasm-edge/wasm/blake2b.wasm";

const ARGON2_MEMORY_KIB = 19_456;
const ARGON2_ITERATIONS = 2;
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_LENGTH = 32;
const ARGON2_SALT_BYTES = 16;

// Workerd supplies precompiled Wasm modules through the bundle. Initializing
// this module cache once avoids runtime Wasm compilation and file-system I/O.
setWASMModules({ argon2WASM, blake2bWASM });

const expectedHashPattern = new RegExp(
  `^\\$argon2id\\$v=19\\$m=${ARGON2_MEMORY_KIB},t=${ARGON2_ITERATIONS},p=${ARGON2_PARALLELISM}\\$[A-Za-z0-9+/]+\\$[A-Za-z0-9+/]+$`,
);

/**
 * The sole password hashing authority for customer and admin credentials.
 * Passwords are passed through exactly as validated; this service does not
 * trim, normalize, or log them.
 */
@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const hash = await argon2id({
      password,
      salt: crypto.getRandomValues(new Uint8Array(ARGON2_SALT_BYTES)),
      memorySize: ARGON2_MEMORY_KIB,
      iterations: ARGON2_ITERATIONS,
      parallelism: ARGON2_PARALLELISM,
      hashLength: ARGON2_HASH_LENGTH,
      outputType: "encoded",
    });

    return hash;
  }

  async verify(password: string, encodedHash: string | null | undefined) {
    // Do not let a malformed/tampered PHC string select costly attacker-owned
    // Argon parameters. Only hashes emitted by this service are accepted.
    if (!encodedHash || !expectedHashPattern.test(encodedHash)) {
      return false;
    }

    try {
      return await argon2Verify({ password, hash: encodedHash });
    } catch {
      // Verification failures intentionally use the caller's generic auth
      // error contract, without exposing library or hash details.
      return false;
    }
  }
}

