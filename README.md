## File includes:

- Notification service
- SQS listener for product events

## Prerequisites

Requires Docker to be installed on local machine.

Requires LocalStack SQS to be running and reachable from Docker on `host.docker.internal:4566`.

## Installation

Create an `.env` file based on `.env.example`, then run:

```bash
$ docker compose up --build
```

## Description

This service listens to SQS messages from the Products service and logs received events to the console.
