import { ValidationPipe, type INestApplication } from "@nestjs/common";
import cookieParser from "cookie-parser";
import helmet from "helmet";

/** Shared HTTP behavior for both the conventional Node and Worker entries. */
export function configureApplication(app: INestApplication): void {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(cookieParser());

  const frontendOrigin =
    process.env.FRONTEND_ORIGIN || "http://localhost:3000";
  app.enableCors({
    origin: frontendOrigin.split(",").map((origin) => origin.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
}
