import { Injectable, Logger } from "@nestjs/common";

export type NotificationEvent = {
  data?: Record<string, unknown>;
  occurredAt?: string;
  type?: string;
};

@Injectable()
export class NotificationEventsService {
  private readonly logger = new Logger(NotificationEventsService.name);

  handle(event: NotificationEvent): void {
    this.logger.log(`Received notification event: ${JSON.stringify(event)}`);
  }
}
