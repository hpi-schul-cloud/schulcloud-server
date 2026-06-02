import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class NotificationLoggable implements Loggable {
	constructor(private readonly userId: string) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const message = `New notification for user ${this.userId}`;

		return {
			type: 'USER_NOTIFICATION',
			message,
			data: { userId: this.userId },
		};
	}
}
