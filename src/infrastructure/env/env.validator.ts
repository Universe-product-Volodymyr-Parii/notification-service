import { z } from "zod";

export const envSchema = z.object({
  HOST: z.string().nonempty(),
  PORT: z.coerce.number().positive().max(65535),

  AWS_ACCESS_KEY_ID: z.string().nonempty().default("test"),
  AWS_REGION: z.string().nonempty().default("us-east-1"),
  AWS_SECRET_ACCESS_KEY: z.string().nonempty().default("test"),
  DATABASE_URL: z.url().nonempty(),
  SQS_ENDPOINT: z.url().nonempty(),
  SQS_QUEUE_URL: z.url().nonempty(),
});
