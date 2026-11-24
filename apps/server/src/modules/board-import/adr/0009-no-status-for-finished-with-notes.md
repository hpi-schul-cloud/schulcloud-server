# 0009 - No status for a finished import with notes

## Status

Accepted (2026-11-24)

## Context

An import can finish although it could not convert some contents. The user must see this in the import report.

## Decision

- The job keeps its four statuses: `waiting`, `running`, `finished` and `failed` (see [0005](0005-import-job-in-mongodb.md)).
- There is no status "finished with notes". The notes of an import will be a field of the job. A finished job with notes is a finished import with notes.

## Consequences

- The status tells only where the job is in its life cycle. A client must read the notes to show the result.
- The notes field does not exist yet. It comes together with the import report.
