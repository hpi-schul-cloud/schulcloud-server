import { Loggable, LogMessage } from '@core/logger';

export class TspMissingExternalIdLoggable implements Loggable {
	constructor(private readonly objectType: string) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `A ${this.objectType} is missing an id. It is skipped.`,
			data: {
				objectType: this.objectType,
			},
		};

		return message;
	}
}
