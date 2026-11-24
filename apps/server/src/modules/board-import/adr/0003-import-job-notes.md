# 0003 - No separate status for a finished import with notes

Status: accepted

## Context

An import can finish although it could not convert some contents. The user must see this in the import report.

## Decision

- The job has four statuses: `waiting`, `running`, `finished` and `failed`.
- There is no status "finished with notes". The notes of an import will be a field of the job. A finished job with notes is a finished import with notes.

## Consequences

- The status tells only where the job is in its life cycle. A client must read the notes to show the result.
- The notes field does not exist yet. It comes together with the import report.
