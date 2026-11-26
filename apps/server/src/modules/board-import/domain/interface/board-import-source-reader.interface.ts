import { type BoardImportJob } from '../do';

export interface BoardImportSourceReader {
	type: string;
	// Rejects with BoardImportJobRejectedError when a new attempt cannot help, and with another error when it can.
	readBoard(job: BoardImportJob, signal: AbortSignal): Promise<string>;
}
