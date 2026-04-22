import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
const { PORT = 8081, HOST = "0.0.0.0" } = process.env;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT, HOST);
}
bootstrap().catch(console.error);
