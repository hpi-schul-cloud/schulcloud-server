import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class NotificationLoggable implements Loggable {
	constructor(private readonly userId: string) {}

	public getLogMessage(): LoggableMessage {
		const message = `New notification for user ${this.userId}`;

		return {
			type: 'USER_NOTIFICATION',
			message,
			data: { userId: this.userId },
		};
	}
}
