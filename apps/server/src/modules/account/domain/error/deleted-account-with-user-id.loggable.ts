import { Loggable, LogMessage } from '@core/logger';

export class DeletedAccountWithUserIdLoggable implements Loggable {
	constructor(private readonly userId: string) {}

	public getLogMessage(): LogMessage {
		const message = {
			message: `Account deleted`,
			data: { userId: this.userId },
		};

		return message;
	}
}
