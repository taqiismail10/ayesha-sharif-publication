import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApplication } from "./bootstrap";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApplication(app);

  const port = Number(process.env.API_PORT) || 4000;
  await app.listen(port);
  console.log(`[asp-api] listening on http://localhost:${port}`);
}

void bootstrap();
