import { NestFactory } from "@nestjs/core";
import { httpServerHandler } from "cloudflare:node";
import "reflect-metadata";
import { AppModule } from "./app.module";
import { configureApplication } from "./bootstrap";
import { PrismaService } from "./prisma/prisma.service";
import { UploadsService, isManagedUploadKey } from "./uploads/uploads.service";



// In Workers this is a routing key for httpServerHandler, not an exposed TCP
// listener. Nest and Prisma are initialized once for each Worker isolate.
const WORKER_HTTP_PORT = 8080;

async function bootstrapWorker(binding: D1Database, storage: R2Bucket): Promise<ExportedHandler> {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "error", "warn"],
  });
  app.get(PrismaService).bind(binding);
  app.get(UploadsService).bind(storage);
  configureApplication(app);
  await app.listen(WORKER_HTTP_PORT);
  return httpServerHandler({ port: WORKER_HTTP_PORT });
}

async function serveUpload(request: Request, storage: R2Bucket): Promise<Response | null> {
  if (request.method !== "GET") return null;
  const key = new URL(request.url).pathname.replace(/^\/uploads\//, "");
  if (!isManagedUploadKey(key)) return null;

  const object = await storage.get(key);
  if (!object) return new Response("Not found.", { status: 404 });

  const headers = new Headers();
  if (object.httpMetadata?.contentType) headers.set("Content-Type", object.httpMetadata.contentType);
  if (object.httpMetadata?.contentDisposition) headers.set("Content-Disposition", object.httpMetadata.contentDisposition);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", object.httpEtag);
  return new Response(object.body, { headers });
}

let handlerPromise: Promise<ExportedHandler> | undefined;

export default {
  async fetch(request, env, context) {
    const upload = await serveUpload(request, env.ASP_STORAGE);
    if (upload) return upload;
    handlerPromise ??= bootstrapWorker(env.asp_db, env.ASP_STORAGE);
    const handler = await handlerPromise;
    if (!handler.fetch) throw new Error("Node HTTP handler is unavailable.");
    return handler.fetch(request, env, context);
  },
} satisfies ExportedHandler<WorkerEnv>;


