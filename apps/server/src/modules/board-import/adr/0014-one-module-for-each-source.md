# 0014 - Each source is a separate module

## Status

Accepted (2026-11-26)

## Context

The import will read boards from more than one source tool. Each source has its own host names, its own switch ([0012](0012-source-switch-in-the-runtime-config.md)), its own link format and its own interface.

With all sources in the module `board-import` ([0003](0003-own-module-apps-and-ansible-role.md)), each new source changes the shared logic: the list of source types, the configuration of the hosts, the list of switches, the selection of the reader and the providers of the worker. The module grows with each source, and a change for one source can break another source.

The import API needs only the data to check a link and to read the switch. The worker also needs the code that reads the board. The import API must not load that code.

Rejected alternatives:

- The apps give a list of sources to the modules of `board-import`: the modules become dynamic modules. This is more wiring for the same result.
- A decorator marks a source, and `board-import` scans all providers: the app must import the module of the source also, so this saves nothing. The server has no example of this pattern.

## Decision

- Each source is a separate module, for example `board-import-taskcards`. The module contains all code that knows the source: the type name, the hosts, the switch key, the link format, the reader and the test data.
- `board-import` contains the shared logic and the contract for a source:
  - A source definition: the type, the hosts of the boards and the key of the switch.
  - A source reader: it reads the board of a job.
- `board-import` has one registry for the definitions and one registry for the readers. A source puts its definition and its reader into the registries when the app starts. The authorization rules of the server use the same pattern.
- The registry of the definitions checks the format of the hosts. Thus no source can register a host that the link check does not expect.
- The shared logic finds a source only through the registries. It contains no name of a source.
- A source has two Nest modules. The first one registers the definition, for the import API and the worker. The second one registers the reader, for the worker only.
- Each import app imports the Nest modules of the sources in its app module.
- The type of a source is a text in the job. The shared logic has no list of all types.
- A reader sends requests only through the checked client of `board-import` ([0013](0013-checked-requests-to-the-sources.md)).

## Consequences

- A new source needs a new module and one import line in the app module of each import app. Two more steps stay manual: the switch key in the default list of the server ([0012](0012-source-switch-in-the-runtime-config.md)) and the hosts in the configuration of the deployment.
- If the import API does not import a source, a link to this source gets the answer "unknown source".
- If the worker has no reader for the source of a job, the job fails at once, without a new attempt. This also applies to jobs of a source that was removed.
- If two sources have the same type, the app does not start. `board-import` does not check if the hosts of two sources overlap.
- A missing import is not visible at compile time. Tests of the apps check that each source is registered.
- `board-import` and a source module depend on each other: the source module uses the contract, and the app modules of `board-import` import the source module. Only the app modules have this dependency.
- The import API and the server load the file of the checked client through the facade of `board-import`, but do not create the client.
