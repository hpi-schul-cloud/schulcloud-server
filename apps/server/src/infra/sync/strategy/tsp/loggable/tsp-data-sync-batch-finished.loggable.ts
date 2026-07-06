import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class TspDataSyncBatchFinishedLoggable implements Loggable {
	constructor(
		private readonly processedCount: number,
		private readonly batchSize: number,
		private readonly batchCount: number,
		private readonly batchIndex: number
	) {}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			message: `Processed ${this.processedCount} of ${this.batchSize} users in batch ${this.batchIndex} of ${this.batchCount}.`,
			data: {
				processedCount: this.processedCount,
				batchSize: this.batchSize,
				batchCount: this.batchCount,
				batchIndex: this.batchIndex,
			},
		};

		return message;
	}
}
