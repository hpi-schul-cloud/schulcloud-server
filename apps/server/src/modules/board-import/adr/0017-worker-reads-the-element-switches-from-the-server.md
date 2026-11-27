# 0017 - The worker reads the element switches of the instance from the server

## Status

Accepted (2026-11-27)

## Context

An instance can switch off some element types of a board, for example the link element. The switches are environment variables of the server. The server gives them to the client in its public configuration, and the client hides an element type that is off. The API of the board does not check the switches: it creates an element of each type.

The worker creates the elements through the API of the board ([0011](0011-worker-creates-a-short-lived-jwt-for-the-user.md)). Thus the import must check the switches itself. The rule that replaces an element type that is off is a rule of the board, so it belongs to the planner ([0015](0015-two-models-between-source-and-board.md)).

Rejected alternatives:

- The same environment variables in the configuration of the worker: each switch then has two places in the deployment. If they differ, the import creates elements that the instance has switched off.
- The planner reads the switches itself: the planner would send requests and would not be a function without side effects.
- The exporter checks the switches when it creates an element: the import notes are written with the plan, before the board is created.

## Decision

- The worker reads the switches from the public configuration of the server, with one request without a token. The worker has no configuration of its own for them.
- The worker reads them when it makes the board plan, before it reads the source. It gives them to the planner as a value. The planner stays a function without side effects.
- The planner applies the switches. For an element type that is off, it plans the replacement of that type and writes an import note.
- If the worker cannot read the switches, or if a switch is missing in the answer, the attempt fails and the broker delivers the message again ([0008](0008-retry-import-jobs-through-redelivery.md)). A missing switch does not count as on or off.

## Consequences

- A switch has one place in the deployment. A new element type of the import needs no new configuration of the worker.
- The switches have an effect when the plan is made. A later attempt uses the stored plan ([0016](0016-checkpoints-and-board-plan-in-the-import-job.md)), so a change of a switch during an import has no effect on that import.
- The worker depends on the public configuration of the server: a switch that the server renames or removes fails each new import. The worker already needs the server to create the board.
- Each new import makes one more request to the server.
