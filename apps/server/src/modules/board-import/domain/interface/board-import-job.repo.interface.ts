import { type EntityId } from '@shared/domain/types';
import { type BoardImportJob } from '../do';
import { type BoardImportJobLogReason, type BoardImportJobStatus, type BoardImportNote, type BoardPlan } from '../type';

export interface BoardImportJobRepo {
	save(job: BoardImportJob): Promise<BoardImportJob>;

	// Throws BoardImportJobUnreadableError when the stored job does not match the domain object.
	findById(id: EntityId): Promise<BoardImportJob | null>;

	// Sets a job that has no end status to running and counts the attempt, in one database operation.
	// Returns null when no such job exists.
	startAttempt(id: EntityId, now: Date): Promise<BoardImportJob | null>;

	// Sets the end status only if the job is running in the given attempt, so that a worker with an older attempt
	// cannot overwrite it. Returns false when the job has another status or attempt.
	closeAttempt(
		id: EntityId,
		attempts: number,
		status: BoardImportJobStatus.FINISHED | BoardImportJobStatus.FAILED,
		failureReason?: BoardImportJobLogReason
	): Promise<boolean>;

	// Sets the job to failed only if it is still waiting. Returns false when the job has another status.
	failIfWaiting(id: EntityId): Promise<boolean>;

	// Sets the job to failed only if it has no end status. Does not read the other fields of the job.
	// Returns false when the job has an end status.
	failIfOpen(id: EntityId): Promise<boolean>;

	// The writes below belong to one attempt. They apply only if the job is running in the given attempt, so that a
	// worker with an older attempt cannot change the board data of a later attempt. If not, they throw
	// BoardImportJobRejectedError and change nothing.

	setBoardId(id: EntityId, attempts: number, boardId: EntityId): Promise<void>;

	// Removes the board and its checkpoints from the job. The plan stays.
	resetBoard(id: EntityId, attempts: number): Promise<void>;

	// Stores the plan and its notes in one database operation.
	setPlan(id: EntityId, attempts: number, plan: BoardPlan, notes: BoardImportNote[]): Promise<void>;

	// Adds the checkpoint of the next column of the plan.
	addColumnCheckpoint(id: EntityId, attempts: number, columnId: EntityId): Promise<void>;

	// Adds the next card to the checkpoint of the column at the given position.
	addCardCheckpoint(id: EntityId, attempts: number, columnIndex: number, cardId: EntityId): Promise<void>;
}

export const BOARD_IMPORT_JOB_REPO = 'BOARD_IMPORT_JOB_REPO';
