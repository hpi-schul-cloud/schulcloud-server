# 0007 - Acknowledge an import job after the end status

## Status

Accepted (2026-11-24)

## Context

The import worker gets the ID of an import job from the queue `board-import-job` (see [0002](0002-asynchronous-import-through-rabbitmq.md)). A job must not get lost when a worker stops during the work.

The helper `registerAmqpSubscriber` of the provisioning module catches each error of the handler. The broker then gets an acknowledgement for a job that did not finish.

## Decision

- The worker has its own consumer, `BoardImportJobConsumer`. It uses `AmqpConnection.createSubscriber` directly.
- The handler resolves only after the end status of the job is in the database. The RabbitMQ library sends the acknowledgement at that moment.
- When the work fails, the handler returns `Nack(true)`. The broker puts the message back into the queue.
- The handler does not throw. The RabbitMQ library logs each error that a handler throws, and an error can contain contents or links of the source.
- A message without a job ID, a missing job and a job with the status `finished` or `failed` get an acknowledgement and no work. A job with the status `running` is a job that the broker delivers again, and the worker processes it again (see [0008](0008-retry-import-jobs-through-redelivery.md)).
- The board import has its own RabbitMQ configuration. `BOARD_IMPORT_PREFETCH_COUNT` is the number of jobs that one worker processes at the same time. The default is 1.

## Consequences

- When a worker stops, the broker delivers its open jobs again. No job gets lost.
- A job can run more than one time. Each import step must be safe to repeat.
- If the import steps obey the abort signal, the prefetch count multiplied by the number of workers is the maximum number of parallel imports. An import that ignores the signal continues after its job is `failed`, while the worker takes the next job.
