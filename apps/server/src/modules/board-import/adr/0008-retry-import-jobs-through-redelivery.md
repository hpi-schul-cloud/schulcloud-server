# 0008 - Retry import jobs through redelivery

## Status

Accepted (2026-11-24)

[0011](0011-worker-creates-a-short-lived-jwt-for-the-user.md) adds errors that set a job to `failed` in each attempt (2026-11-25).

[0013](0013-checked-requests-to-the-sources.md) adds errors of the source requests that set a job to `failed` in each attempt (2026-11-27).

## Context

A job that the broker delivers again must not run without end. The import uses no delayed queues and no dead-letter queues (see [0002](0002-asynchronous-import-through-rabbitmq.md)).

## Decision

- The job stores `attempts` and `startedAt`. Each time the worker starts the work, it sets the status `running` and increments `attempts` in one database operation. The operation applies only to a job without an end status. `startedAt` is the time of the first start, so the wait time in the queue does not count.
- The import API sets a job to `failed` after a publish error only if the job is still `waiting`. If a worker already took the job, the message did arrive, and the API returns the job as started. This replaces the rule for publish errors in [0002](0002-asynchronous-import-through-rabbitmq.md).
- Before each start, the worker checks two limits: `BOARD_IMPORT_JOB_MAX_ATTEMPTS` (default 3) and `BOARD_IMPORT_JOB_MAX_DURATION_IN_MINUTES` (default 25). If a limit is reached, the job gets the status `failed`.
- The worker stores the end status only if the job is still `running` in the attempt of the worker. Thus a worker with an older attempt cannot overwrite the result of a later attempt. Exception: when the checks before the start find a limit reached, the worker sets the current attempt to `failed`, also if another worker still runs that attempt.
- During the work, a timer enforces the maximum duration. When the time is over, the worker aborts the import through an `AbortSignal` and sets the job to `failed`.
- An error during the work and a stopped worker use the same path: the broker delivers the message again. When the error occurs in the last permitted attempt, the worker sets the job to `failed` at once.
- Before the worker gives a failed message back to the queue, it waits `BOARD_IMPORT_JOB_RETRY_DELAY_IN_SECONDS` (default 10). During this time the message keeps one prefetch slot.

## Consequences

- A rollout or a scale-down of the worker during an import uses one attempt.
- When a worker stops and no worker starts again, the job keeps the status `running`. An alert for such jobs is necessary.
- The maximum duration must stay below the acknowledgement timeout of RabbitMQ, which is 30 minutes by default. The broker closes the channel of a consumer that holds a message longer, and delivers the message again. A longer import needs a higher timeout in the broker.
- If the import steps obey the abort signal, a job cannot be `failed` for the user and run in a worker at the same time. Exception: a worker loses its connection during the last permitted attempt or near the maximum duration, and the broker delivers the message to another worker. The checks before the start of the other worker set the job to `failed`, but the first worker does not get an abort signal and continues. If it finishes, the job stays `failed`. This case is rare, and the import steps can run again.
- The import that runs longer than the maximum duration gets the abort signal, but the worker does not wait for it to stop. An import step must obey the signal.
