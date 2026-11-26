# 0012 - The switch for each source is in the runtime config

## Status

Accepted (2026-11-26)

## Context

The import reads boards from external sources through interfaces that are not official. A source can change, limit or block these requests at any time. Operations must then stop new imports from this source at once, without a deployment. The other sources must stay available.

`FEATURE_BOARD_IMPORT_ENABLED` is an environment variable. A change needs a deployment, and it stops the import from all sources.

The server has a runtime configuration: values in the collection `runtimeconfigs` of the instance database, with defaults in the code. The `superhero-dashboard` shows and changes these values through the API of the server. The import API is a separate app ([ADR 0003](0003-own-module-apps-and-ansible-role.md)) with access to the same database.

Rejected alternatives:

- One environment variable for each source: a change needs a deployment.
- The import API asks the server for the value: this adds a request and a dependency on the server to each start of an import. The egress policy of the import API ([ADR 0004](0004-egress-policy-for-the-import-api.md)) would need a new rule.
- A separate runtime configuration for the import API: the `superhero-dashboard` would not show its keys.

## Decision

- Each source has one boolean key in the runtime configuration of the server, for example `BOARD_IMPORT_TASKCARDS_ENABLED`. The default is on.
- The key is part of the default list of the server. Thus the `superhero-dashboard` shows it without a change.
- The import API reads the value directly from the database, with the runtime configuration module of the server. It reads the value at each start of an import and does not cache it.
- If the switch of a source is off, the import API rejects a link to this source and creates no job.
- `FEATURE_BOARD_IMPORT_ENABLED` stays the switch for the full import.

## Consequences

- A change of a switch has an effect on the next start of an import, without a deployment or a restart.
- The switch stops only new imports. Jobs that wait or run continue.
- Each start of an import makes one more read from the database.
- The import API reads a collection that the server owns. A change of the format of the runtime configuration also has an effect on the import API.
- A new source needs a new key in the default list of the server and in the list of switch keys of the board import. An API test of the board import fails if the two keys are different.
- If the import API cannot read the value, the start of the import fails and no job is created.
