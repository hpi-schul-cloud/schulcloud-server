# 0002 - Import job retries use redelivery and a counter in the job

Status: accepted

## Context

A job that the broker delivers again must not run without end. The SchulCloud has no queues with a delay and no dead-letter queues, and the board import does not add them.

## Decision

- The job stores `attempts` and `startedAt`. The worker increments `attempts` and sets the status `running` each time it starts the work. `startedAt` is the time of the first start, so the wait time in the queue does not count.
- Before each start, the worker checks two limits: `BOARD_IMPORT_JOB_MAX_ATTEMPTS` (default 3) and `BOARD_IMPORT_JOB_MAX_DURATION_IN_MINUTES` (default 30). If a limit is reached, the job gets the status `failed`.
- During the work, a timer enforces the maximum duration. When the time is over, the worker aborts the import through an `AbortSignal` and sets the job to `failed`.
- An error during the work and a stopped worker use the same path: the broker delivers the message again. When the error occurs in the last permitted attempt, the worker sets the job to `failed` at once.
- Before the worker gives a failed message back to the queue, it waits `BOARD_IMPORT_JOB_RETRY_DELAY_IN_SECONDS` (default 10). During this time the message keeps one prefetch slot.

## Consequences

- A rollout or a scale-down of the worker during an import uses one attempt.
- When a worker stops and no worker starts again, the job keeps the status `running`. An alert for such jobs is necessary.
- The counter is not atomic. If the broker delivers a job to two workers at the same time, the counter can be wrong by one.
