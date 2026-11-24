import { Injectable } from '@nestjs/common';
import { type BoardImportJob } from '../do';

@Injectable()
export class BoardImportRunnerService {
	// Placeholder for the import steps. The signal aborts when the job is over its maximum duration or when the run failed.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async run(job: BoardImportJob, signal: AbortSignal): Promise<void> {
		await Promise.resolve();
	}
}
