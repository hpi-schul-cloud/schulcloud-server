import { Loggable, LogMessage } from '@src/core/logger';

export class TspMissingExternalIdLoggable implements Loggable {
	constructor(private readonly objectType: string) {}

	getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `A ${this.objectType} is missing an id. It is skipped.`,
			data: {
				objectType: this.objectType,
			},
		};

		return message;
	}
}
