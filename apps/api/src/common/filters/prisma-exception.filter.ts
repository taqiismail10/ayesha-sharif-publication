import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { Prisma } from "../../../generated/prisma";
import type { Response } from "express";

/**
 * Maps Prisma known request errors to HTTP responses so feature modules
 * (Phase 1+) don't repeat try/catch P2002 boilerplate:
 *   P2002 unique-constraint violation → 409 Conflict
 *   P2025 record not found             → 404 Not Found
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    switch (exception.code) {
      case "P2002":
        return response.status(HttpStatus.CONFLICT).json({
          ok: false,
          statusCode: HttpStatus.CONFLICT,
          message: "A record with this value already exists.",
        });
      case "P2025":
        return response.status(HttpStatus.NOT_FOUND).json({
          ok: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: "Record not found.",
        });
      default:
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          ok: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "Database request failed.",
        });
    }
  }
}
