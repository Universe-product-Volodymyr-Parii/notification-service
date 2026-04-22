import { DynamicModule, Module } from "@nestjs/common";

import { EnvService } from "./env/env.service";

@Module({})
export class InfraModule {
  static forRoot(): DynamicModule {
    return {
      module: InfraModule,
      global: true,
      providers: [EnvService],
      exports: [EnvService],
    };
  }
}
