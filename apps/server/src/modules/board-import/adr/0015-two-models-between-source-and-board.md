# 0015 - Two models between the source and the board

## Status

Accepted (2026-11-27)

## Context

Each source has its own data format ([0014](0014-one-module-for-each-source.md)). The board of the server has limits and rules: a maximum length of the board title, a fixed set of element types, a fixed set of card colours. Content of a source that does not fit must be shortened, replaced or left out, and the user must learn about it.

With one model between the source and the board, there are two bad options:

- Each source module applies the limits and rules of the board. Then each new source copies them, and a change of a rule changes all source modules.
- The step that creates the board applies them while it sends requests. Then the rules are mixed with requests and retries, and a rule cannot be tested without a board.

## Decision

The import uses two models and one conversion step between them.

- The **intermediate model** describes the content of a source board. It is neutral: it contains no format of a source and no limit or rule of the board. A title can have any length, a card can be empty. It has a version number.
- A source module converts its own format to the intermediate model, and does nothing else with the content. It does not decide if the import can create the content: a link or a file of the source is a link or a file in the model, also when the import cannot create it. Only content that the model has no type for becomes an element of the type "not supported", with a kind. The structure rules of a source, for example which part of the source becomes a section, stay in the source module.
- The **board plan** describes the board that the import creates. It contains only content that the API of the board accepts.
- The **planner** converts the intermediate model to the board plan. It is the only place that applies the limits and rules of the board. For each content that it shortens, replaces or leaves out, it writes an **import note**. A source module writes no import notes.
- The **exporter** creates the board from the board plan. It does not know the intermediate model or a source.
- The intermediate model, the board plan, the planner and the exporter are part of `board-import`.

## Consequences

- A new source needs no change in the planner and the exporter. A new rule of the board needs no change in a source module.
- A new element type needs three changes: a type in the intermediate model, a rule in the planner and a case in the exporter.
- The planner is a function without side effects. Its rules have tests that need no source and no board.
- The intermediate model holds content that the board does not get. Thus it has all data for the import report.
- The board plan has no version number. If the import stores a board plan, the plan needs a version number.
- There are two models to maintain, and each element type exists in the two models.
