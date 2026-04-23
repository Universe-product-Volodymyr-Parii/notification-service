import { DynamicModule, Module } from "@nestjs/common";

import { NotificationModule } from "@/modules/notification/notification.module";

import { AwsConfig } from "./config/aws.config";
import { EnvService } from "./env/env.service";
import { SqsListenerService } from "./sqs/sqs-listener.service";

@Module({})
export class InfraModule {
  static forRoot(): DynamicModule {
    return {
      module: InfraModule,
      imports: [NotificationModule],
      global: true,
      providers: [AwsConfig, EnvService, SqsListenerService],
      exports: [AwsConfig, EnvService, SqsListenerService],
    };
  }
}
