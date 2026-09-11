import "reflect-metadata";
import { httpServerHandler } from "cloudflare:node";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApplication } from "./bootstrap";
import { PrismaService } from "./prisma/prisma.service";

// In Workers this is a routing key for httpServerHandler, not an exposed TCP
// listener. Nest and Prisma are initialized once for each Worker isolate.
const WORKER_HTTP_PORT = 8080;

async function bootstrapWorker(binding: D1Database): Promise<ExportedHandler> {
  const app = await NestFactory.create(AppModule);
  app.get(PrismaService).bind(binding);
  configureApplication(app);
  await app.listen(WORKER_HTTP_PORT);
  return httpServerHandler({ port: WORKER_HTTP_PORT });
}

let handlerPromise: Promise<ExportedHandler> | undefined;

export default {
  async fetch(request, env, context) {
    handlerPromise ??= bootstrapWorker(env.asp_db);
    const handler = await handlerPromise;
    if (!handler.fetch) throw new Error("Node HTTP handler is unavailable.");
    return handler.fetch(request, env, context);
  },
} satisfies ExportedHandler<WorkerEnv>;
