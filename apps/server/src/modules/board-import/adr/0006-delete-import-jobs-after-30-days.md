# 0006 - Delete import jobs after 30 days

## Status

Accepted (2026-11-23)

## Context

An import job contains the user ID and the share link, which can contain an access token (see [0005](0005-import-job-in-mongodb.md)). This data must not stay in the database without a limit. There is no given deletion period for this data. The user must be able to read the result of an import for some time after the import ends.

## Decision

- An import job is deleted 30 days after it was created.
- The job has the field `expiresAt` with a TTL index. MongoDB deletes the job.
- The period is a configuration value (`BOARD_IMPORT_JOB_RETENTION_IN_DAYS`, default 30).
- The RabbitMQ message of a job gets the same expiry time as the job.

## Consequences

- No cleanup job is necessary.
- The job and its message do not disappear at exactly the same moment. MongoDB deletes expired jobs in a background task, and RabbitMQ drops an expired message only when it is at the head of the queue. A message can thus arrive after its job is deleted, and the consumer must drop it.
- All data that the import keeps in a job is deleted together with the job. After that, the user cannot read the status of the import.
- A change of the configuration value has an effect only on new jobs.
- The management app creates the TTL index. Thus the job entity must be in its entity list.
