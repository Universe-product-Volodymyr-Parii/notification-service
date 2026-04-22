import { type ReceiveMessageCommandInput, type SQSClientConfig } from "@aws-sdk/client-sqs";
import { Injectable } from "@nestjs/common";

import { EnvService } from "@infra/env/env.service";

type AwsServiceConfig = {
  clientConfig: SQSClientConfig;
  queueUrl: string;
  receiveMessageCommand: Omit<ReceiveMessageCommandInput, "QueueUrl">;
};

@Injectable()
export class AwsConfig {
  constructor(private readonly envService: EnvService) {}

  getConfig(): AwsServiceConfig {
    return {
      clientConfig: {
        credentials: {
          accessKeyId: this.envService.get("AWS_ACCESS_KEY_ID"),
          secretAccessKey: this.envService.get("AWS_SECRET_ACCESS_KEY"),
        },
        endpoint: this.envService.get("SQS_ENDPOINT"),
        region: this.envService.get("AWS_REGION"),
      },
      queueUrl: this.envService.get("SQS_QUEUE_URL"),
      receiveMessageCommand: {
        MaxNumberOfMessages: 10,
        VisibilityTimeout: 30,
        WaitTimeSeconds: 20,
      },
    };
  }
}
