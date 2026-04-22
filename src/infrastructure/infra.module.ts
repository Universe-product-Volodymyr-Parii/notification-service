import { DynamicModule, Module } from "@nestjs/common";

import { EnvService } from "./env/env.service";
import { SqsListenerService } from "./sqs/sqs-listener.service";

@Module({})
export class InfraModule {
  static forRoot(): DynamicModule {
    return {
      module: InfraModule,
      global: true,
      providers: [EnvService, SqsListenerService],
      exports: [EnvService, SqsListenerService],
    };
  }
}
