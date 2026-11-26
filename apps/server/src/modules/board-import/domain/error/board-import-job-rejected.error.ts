import { type BoardImportJobLogReason } from '../type';

// A new attempt cannot repair the cause, so the job fails at once.
export class BoardImportJobRejectedError extends Error {
	constructor(public readonly reason: BoardImportJobLogReason) {
		super('Board import job rejected');
	}
}
