import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

import { EnvService } from "@infra/env/env.service";

type ProductEvent = {
  data?: Record<string, unknown>;
  occurredAt?: string;
  type?: string;
};

@Injectable()
export class SqsListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqsListenerService.name);
  private readonly client: SQSClient;
  private readonly queueUrl: string;
  private isRunning = false;

  constructor(private readonly envService: EnvService) {
    this.client = new SQSClient({
      credentials: {
        accessKeyId: this.envService.get("AWS_ACCESS_KEY_ID"),
        secretAccessKey: this.envService.get("AWS_SECRET_ACCESS_KEY"),
      },
      endpoint: this.envService.get("SQS_ENDPOINT"),
      region: this.envService.get("AWS_REGION"),
    });
    this.queueUrl = this.envService.get("SQS_QUEUE_URL");
  }

  onModuleInit(): void {
    this.isRunning = true;
    this.logger.log(`Starting SQS listener for queue ${this.queueUrl}`);
    void this.poll();
  }

  onModuleDestroy(): void {
    this.isRunning = false;
    this.logger.log("Stopping SQS listener");
  }

  private async poll(): Promise<void> {
    while (this.isRunning) {
      try {
        const response = await this.client.send(
          new ReceiveMessageCommand({
            MaxNumberOfMessages: 10,
            QueueUrl: this.queueUrl,
            VisibilityTimeout: 30,
            WaitTimeSeconds: 20,
          }),
        );

        for (const message of response.Messages ?? []) {
          this.logMessage(message.Body);

          if (message.ReceiptHandle) {
            await this.client.send(
              new DeleteMessageCommand({
                QueueUrl: this.queueUrl,
                ReceiptHandle: message.ReceiptHandle,
              }),
            );
          }
        }
      } catch (error) {
        this.logger.error("Failed to process SQS messages", error);
        await this.delay(3000);
      }
    }
  }

  private logMessage(body?: string): void {
    if (!body) {
      this.logger.warn("Received empty SQS message");
      return;
    }

    try {
      const parsed = JSON.parse(body) as ProductEvent;
      this.logger.log(`Received SQS event: ${JSON.stringify(parsed)}`);
    } catch {
      this.logger.log(`Received raw SQS message: ${body}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
