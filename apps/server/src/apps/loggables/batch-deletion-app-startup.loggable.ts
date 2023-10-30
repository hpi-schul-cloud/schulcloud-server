import { Loggable, LogMessage } from '@src/core/logger';

interface BatchDeletionAppStartupInfo {
	inputFilePath: string;
}

export class BatchDeletionAppStartupLoggable implements Loggable {
	constructor(private readonly info: BatchDeletionAppStartupInfo) {}

	getLogMessage(): LogMessage {
		return {
			message: 'Successfully started batch deletion app...',
			data: {
				inputFilePath: this.info.inputFilePath,
			},
		};
	}
}
