import { Loggable, LogMessage } from '@src/core/logger';

interface BatchDeletionAppStartupInfo {
	targetRefDomain: string;
	targetRefsFilePath: string;
	deleteInMinutes: number;
	callsDelayMilliseconds: number;
}

export class BatchDeletionAppStartupLoggable implements Loggable {
	constructor(private readonly info: BatchDeletionAppStartupInfo) {}

	getLogMessage(): LogMessage {
		return {
			message: 'Successfully started batch deletion app...',
			data: {
				targetRefDomain: this.info.targetRefDomain,
				targetRefsFilePath: this.info.targetRefsFilePath,
				deleteInMinutes: this.info.deleteInMinutes,
				callsDelayMilliseconds: this.info.callsDelayMilliseconds,
			},
		};
	}
}
