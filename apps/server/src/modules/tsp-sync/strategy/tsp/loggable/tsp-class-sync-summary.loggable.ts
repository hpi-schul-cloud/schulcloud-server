import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class TspClassSyncSummaryLoggable implements Loggable {
	constructor(
		private readonly totalClassUpdateCount: number,
		private readonly totalClassCreationCount: number
	) {}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			message: `In total updated ${this.totalClassUpdateCount} classes and created ${this.totalClassCreationCount} classes.`,
			data: {
				totalClassUpdateCount: this.totalClassUpdateCount,
				totalClassCreationCount: this.totalClassCreationCount,
			},
		};

		return message;
	}
}
