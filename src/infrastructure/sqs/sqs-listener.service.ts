import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

import { AwsConfig } from "@infra/config/aws.config";

import { sleep } from "@lib/utils/sleep";

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
  private readonly receiveMessageCommandConfig: Omit<ReceiveMessageCommand["input"], "QueueUrl">;

  private isRunning = false;

  constructor(private readonly awsConfig: AwsConfig) {
    const config = this.awsConfig.getConfig();

    this.client = new SQSClient(config.clientConfig);
    this.queueUrl = config.queueUrl;
    this.receiveMessageCommandConfig = config.receiveMessageCommand;
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
            QueueUrl: this.queueUrl,
            ...this.receiveMessageCommandConfig,
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
        await sleep(3000);
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
}
