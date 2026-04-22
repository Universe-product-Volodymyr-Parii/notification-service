import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { envSchema } from "@infra/env/env.validator";
import { InfraModule } from "@infra/infra.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    InfraModule.forRoot(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
