# 0010 - Scale the import worker with the queue length

## Status

Accepted (2026-11-24)

## Context

The import worker has work only while users import boards. A worker that always runs uses resources without work. A fixed number of workers is too small when many users start an import at the same time.

The cluster has KEDA. Other workers already scale with the length of their RabbitMQ queue (pattern: the LDAP sync worker). Their trigger uses the AMQP protocol and the connection data of the secret `keda-secret`. With this protocol, KEDA counts only the messages that wait in the queue. It does not count a message that a worker processes and did not acknowledge yet (see [0007](0007-acknowledge-import-job-after-the-end-status.md)).

On the dev clusters, the namespace activator has a `ScaledObject` for each deployment. KEDA permits only one `ScaledObject` for each deployment.

## Decision

A KEDA `ScaledObject` scales the deployment of the import worker with the number of messages that wait in the queue `board-import-job`.

- No worker runs while the queue is empty. KEDA starts one worker for each message that waits, up to `BOARD_IMPORT_WORKER_MAX_REPLICA_COUNT` (default 3).
- The trigger uses the AMQP protocol and the existing `rabbitmq-trigger-auth`.
- KEDA removes workers only after the queue was empty for `BOARD_IMPORT_WORKER_SCALE_DOWN_DELAY_IN_SECONDS` (default 1800). This applies to the scale-down to zero and to the scale-down between the maximum and one worker. The delay is longer than the maximum duration of a job (see [0008](0008-retry-import-jobs-through-redelivery.md)).
- The variable `SCALED_BOARD_IMPORT_WORKER_ENABLED` enables the `ScaledObject`. It is off on the dev clusters, where the namespace activator scales the worker.

## Consequences

- The first import after an idle time waits until KEDA sees the message and a worker pod is ready. The job has the status `waiting` during this time.
- A worker stays for 30 minutes after the last message waited in the queue.
- The delay does not fully protect a running import. When an idle worker takes a message before KEDA sees it, the delay does not start again, and KEDA can remove the worker during the import. The message is then delivered again and the import uses one more attempt.
- A trigger that uses the management API of RabbitMQ can count the messages that are not acknowledged. It needs the address of the management API in `keda-secret` for each instance. Together with a worker that finishes its job before it stops, it would remove this limit.
- The maximum duration of a job and the scale-down delay must be changed together.
- The scaling is not tested on the dev clusters and not in the e2e tests.
- The deployment sets no replica count when KEDA scales the worker. `BOARD_IMPORT_WORKER_REPLICAS` applies only without KEDA.
