import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers. crossOriginResourcePolicy relaxed so that uploaded
  // assets (Phase 3) can be embedded by the Next.js frontend on another port.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(cookieParser());

  // CORS for the Next.js frontend. credentials:true is required because both
  // auth systems (admin + customer) are cookie-based.
  const frontendOrigin =
    process.env.FRONTEND_ORIGIN || "http://localhost:3000";
  app.enableCors({
    origin: frontendOrigin.split(",").map((o) => o.trim()),
    credentials: true,
  });

  // Global validation: strips unknown properties, coerces primitives.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = Number(process.env.API_PORT) || 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[asp-api] listening on http://localhost:${port}`);
}

void bootstrap();
