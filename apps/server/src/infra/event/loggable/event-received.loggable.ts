import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class EventReceivedLoggable implements Loggable {
	constructor(private readonly eventName: string) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'EVENT_RECEIVED',
			message: 'Event received',
			data: {
				eventName: this.eventName,
			},
		};
	}
}
