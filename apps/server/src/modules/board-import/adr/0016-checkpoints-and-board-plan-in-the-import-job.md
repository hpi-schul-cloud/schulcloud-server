# 0016 - Checkpoints and the board plan in the import job

## Status

Accepted (2026-11-27)

## Context

The worker creates a board with many requests to the API of the board: one for each column, card and element. There is no request that creates a full board. When the worker stops during the work, the broker delivers the job again (see [0008](0008-retry-import-jobs-through-redelivery.md)). The new attempt must continue the board and must not create a column or a card again.

A new attempt can find the parts that exist in two ways: it compares the board plan with the board, or it reads from the job what the attempt before created.

- A comparison with the board finds a part by its position. The user can change the board between two attempts, and the source can change. Then the positions do not fit, and the comparison needs rules for each such case.
- The API of the board accepts no key that makes a repeated request safe.

## Decision

- The job stores the board plan (see [0015](0015-two-models-between-source-and-board.md)). The first attempt reads the source, makes the plan and stores it together with the import notes, before it creates the board. A later attempt uses the stored plan. It does not read the source again and does not make a new plan.
- The board plan has a version number. A job with a stored plan of another version fails. The worker does not make a new plan for such a job, because the checkpoints of the job fit only the stored plan.
- The job stores a checkpoint for each column and each card that is complete: the ID that the API of the board returned. A column is complete when it has its title. A card is complete when it has its title and all its elements.
- The exporter creates the columns and cards in the order of the plan. Thus the position of a checkpoint links it to its part of the plan. A new attempt creates only the parts that have no checkpoint.
- The exporter does not compare the board with the plan. It only checks at the start of an attempt that the board of the job exists. If the board does not exist, the job starts again with a new board and without checkpoints.
- The progress that the import API shows is not stored. The API calculates it from the stored plan and the checkpoints.

## Consequences

- When the worker stops between the creation of a column or card and the storage of its checkpoint, the new attempt creates that part again. The board then has the part two times, and the first one can be incomplete. This is accepted. It can occur at most one time for each attempt.
- A change of the source after the first attempt has no effect on the import.
- A change that the user makes to the board during the import stays. If the user deletes a column that has a checkpoint, the requests for the cards of that column fail, and the job fails when its attempts are used.
- The job holds content of the source board: the titles and texts of the plan. This content is deleted together with the job (see [0006](0006-delete-import-jobs-after-30-days.md)). It must not be written to the log.
- Each column and each card needs one more write operation on the job.
- A change of the board plan that a stored plan does not fit needs a new version number. Jobs that are open during the rollout of such a change fail.
