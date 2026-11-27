import { type BoardImportJob } from '../do';
import { type IntermediateBoard } from '../type';

export interface BoardImportSourceReader {
	type: string;
	// Rejects with BoardImportJobRejectedError when a new attempt cannot help, and with another error when it can.
	readBoard(job: BoardImportJob, signal: AbortSignal): Promise<IntermediateBoard>;
}
