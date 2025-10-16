import { Loggable, LogMessage } from '@core/logger';

export class TspClassSyncSummaryLoggable implements Loggable {
	constructor(private readonly totalClassUpdateCount: number, private readonly totalClassCreationCount: number) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `In total updated ${this.totalClassUpdateCount} classes and created ${this.totalClassCreationCount} classes.`,
			data: {
				totalClassUpdateCount: this.totalClassUpdateCount,
				totalClassCreationCount: this.totalClassCreationCount,
			},
		};

		return message;
	}
}
