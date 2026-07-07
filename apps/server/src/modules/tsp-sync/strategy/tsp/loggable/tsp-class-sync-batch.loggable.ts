import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class TspClassSyncBatchLoggable implements Loggable {
	constructor(
		private readonly classUpdateCount: number,
		private readonly classCreationCount: number,
		private readonly schoolExternalId: string
	) {}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			message: `Updated ${this.classUpdateCount} classes and created ${this.classCreationCount} classes for external school ${this.schoolExternalId}.`,
			data: {
				classUpdateCount: this.classUpdateCount,
				classCreationCount: this.classCreationCount,
				schoolExternalId: this.schoolExternalId,
			},
		};

		return message;
	}
}
