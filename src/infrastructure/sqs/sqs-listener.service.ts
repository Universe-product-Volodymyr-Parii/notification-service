import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

import { AwsConfig } from "@infra/config/aws.config";

import { sleep } from "@lib/utils/sleep";

import { NotificationEventsService, type NotificationEvent } from "@/modules/notification/notification-events.service";

@Injectable()
export class SqsListenerService implements OnModuleInit, OnModuleDestroy {
  private static readonly MAX_RECONNECT_DELAY_MS = 15000;
  private static readonly RECONNECT_DELAY_MS = 1000;

  private readonly logger = new Logger(SqsListenerService.name);
  private readonly queueUrl: string;
  private readonly receiveMessageCommandConfig: Omit<ReceiveMessageCommand["input"], "QueueUrl">;

  private client: SQSClient;
  private isRunning = false;
  private reconnectAttempts = 0;

  constructor(
    private readonly awsConfig: AwsConfig,
    private readonly notificationEventsService: NotificationEventsService,
  ) {
    const config = this.awsConfig.getConfig();

    this.queueUrl = config.queueUrl;
    this.receiveMessageCommandConfig = config.receiveMessageCommand;
    this.client = this.createClient();
  }

  onModuleInit(): void {
    this.isRunning = true;
    this.logger.log(`Starting SQS listener for queue ${this.queueUrl}`);
    void this.poll();
  }

  onModuleDestroy(): void {
    this.isRunning = false;
    this.client.destroy();
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

        this.reconnectAttempts = 0;
      } catch (error) {
        const errorSummary = this.formatError(error);

        this.logger.error(`Failed to process SQS messages: ${errorSummary}`);
        await this.reconnect(errorSummary);
      }
    }
  }

  private createClient(): SQSClient {
    const config = this.awsConfig.getConfig();

    return new SQSClient(config.clientConfig);
  }

  private async reconnect(errorSummary: string): Promise<void> {
    this.reconnectAttempts += 1;

    const reconnectDelay = Math.min(
      SqsListenerService.RECONNECT_DELAY_MS * 2 ** (this.reconnectAttempts - 1),
      SqsListenerService.MAX_RECONNECT_DELAY_MS,
    );

    this.client.destroy();
    this.client = this.createClient();

    this.logger.warn(
      `Reconnecting to SQS in ${reconnectDelay}ms (attempt ${this.reconnectAttempts}) after: ${errorSummary}`,
    );

    await sleep(reconnectDelay);
  }

  private formatError(error: unknown): string {
    if (!(error instanceof Error)) {
      return "Unknown SQS error";
    }

    const errorWithMetadata = error as Error & {
      code?: string;
      $metadata?: {
        attempts?: number;
        totalRetryDelay?: number;
      };
    };

    const details = [errorWithMetadata.name, errorWithMetadata.code, errorWithMetadata.message].filter(Boolean);

    if (errorWithMetadata.$metadata?.attempts) {
      details.push(`sdkAttempts=${errorWithMetadata.$metadata.attempts}`);
    }

    if (errorWithMetadata.$metadata?.totalRetryDelay !== undefined) {
      details.push(`sdkRetryDelay=${errorWithMetadata.$metadata.totalRetryDelay}ms`);
    }

    return details.join(" | ");
  }

  private logMessage(body?: string): void {
    if (!body) {
      this.logger.warn("Received empty SQS message");
      return;
    }

    try {
      const parsed = JSON.parse(body) as NotificationEvent;
      this.notificationEventsService.handle(parsed);
    } catch {
      this.logger.log(`Received raw SQS message: ${body}`);
    }
  }
}
