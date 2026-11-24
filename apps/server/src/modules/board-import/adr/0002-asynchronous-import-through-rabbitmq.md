# 0002 - Asynchronous import through RabbitMQ

## Status

Accepted (2026-11-17)

The rule for publish errors is superseded by [0008](0008-retry-import-jobs-through-redelivery.md) (2026-11-24).

## Context

An import reads a board from an external tool and copies its files. Some boards have more than 2 GB of files, so an import can take much longer than an HTTP request. An import must also continue after a pod restart.

Only a small part of the users have boards to import, and few imports run at the same time. Throughput is not the reason for a queue.

## Decision

The import runs asynchronously. The import API stores an import job, publishes a message to RabbitMQ and answers immediately. A worker consumes the message and does the import.

- The import uses only what the existing RabbitMQ of the SchulCloud offers, without plugins, delayed queues or dead-letter queues.
- The exchange is `board-import` (direct). The queue and the routing key are `board-import-job`.
- The message contains only the ID of the import job. All other data is in the job (see [0005](0005-import-job-in-mongodb.md)).
- Messages are persistent. Each app that publishes or consumes import jobs declares the queue.
- A message expires together with its job (see [0006](0006-delete-import-jobs-after-30-days.md)).
- If the publish fails or takes more than 5 seconds, the request fails and the job gets the status `failed`.

## Consequences

- A job that is published before the first worker starts is not lost. A job also stays in the queue after a broker restart.
- The broker can still enqueue a message after a publish error. The consumer must skip each job that has the status `finished` or `failed`.
- After a pod restart, the broker delivers the message again and the job has the status `running`. The consumer must process such a job again.
- The consumer must acknowledge a message only after the import ends. RabbitMQ closes the channel of a consumer that holds a message longer than its acknowledgement timeout (30 minutes by default) and delivers the message again. An import must end before this timeout, or the timeout must be raised.
- The client does not get the result in the answer of the start request. It reads the status of the job from the import API.
- The import API needs a connection to RabbitMQ to start.
