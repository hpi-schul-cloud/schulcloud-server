import { type EntityId } from '@shared/domain/types';
import { type BoardImportJob } from '../do';

export interface BoardImportJobRepo {
	save(job: BoardImportJob): Promise<BoardImportJob>;

	findById(id: EntityId): Promise<BoardImportJob | null>;

	// Sets a job that has no end status to running and counts the attempt, in one database operation.
	// Returns null when no such job exists.
	startAttempt(id: EntityId, now: Date): Promise<BoardImportJob | null>;

	// Sets the job to failed only if it is still waiting. Returns false when the job has another status.
	failIfWaiting(id: EntityId): Promise<boolean>;
}

export const BOARD_IMPORT_JOB_REPO = 'BOARD_IMPORT_JOB_REPO';
