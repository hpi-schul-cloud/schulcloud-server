import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class EventListenerMissingLoggable implements Loggable {
	constructor(private readonly eventName: string) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'EVENT_LISTENER_MISSING',
			message: 'There is no event listener available to handle this event',
			data: {
				eventName: this.eventName,
			},
		};
	}
}
