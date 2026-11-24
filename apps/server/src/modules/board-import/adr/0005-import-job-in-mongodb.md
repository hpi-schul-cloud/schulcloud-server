# 0005 - Import job in MongoDB

## Status

Accepted (2026-11-20)

## Context

The import API and the import worker are different apps (see [0003](0003-own-module-apps-and-ansible-role.md)). They need a common state for each import: who started it, which link it uses and how far it is. The user must be able to read the status when the import runs without a session of the user.

The import runs in the context of the user. The imported content must belong to the user and not to a technical account.

## Decision

- Each import is one import job in the collection `board-import-jobs`, in the MongoDB of the instance.
- The job is the only place that holds the state of an import. The RabbitMQ message contains only the job ID.
- The job contains the user ID, the share link, the status (`waiting`, `running`, `finished`, `failed`) and the expiry date.
- The import API reads the user ID from the JWT when the import starts. The user ID does not come from the request body or from the source.
- Only the user who started a job can read it. For a job of another user, the API gives the same answer as for a job that does not exist (404).

## Consequences

- The data of an import stays in the instance.
- The worker gets the identity of the user from the job. The JWT of the session is not stored and does not go through the queue.
- Job IDs cannot be used to find out if a job of another user exists.
- The job contains the share link, which is confidential (see [0001](0001-share-link-as-only-access-to-source-boards.md)). Thus jobs have a deletion period (see [0006](0006-delete-import-jobs-after-30-days.md)).
