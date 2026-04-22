import { DynamicModule, Module } from "@nestjs/common";

import { AwsConfig } from "./config/aws.config";
import { EnvService } from "./env/env.service";
import { SqsListenerService } from "./sqs/sqs-listener.service";

@Module({})
export class InfraModule {
  static forRoot(): DynamicModule {
    return {
      module: InfraModule,
      global: true,
      providers: [AwsConfig, EnvService, SqsListenerService],
      exports: [AwsConfig, EnvService, SqsListenerService],
    };
  }
}
