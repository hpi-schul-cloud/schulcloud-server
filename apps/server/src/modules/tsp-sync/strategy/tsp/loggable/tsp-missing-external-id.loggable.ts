import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class TspMissingExternalIdLoggable implements Loggable {
	constructor(private readonly objectType: string) {}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			message: `A ${this.objectType} is missing an id. It is skipped.`,
			data: {
				objectType: this.objectType,
			},
		};

		return message;
	}
}
