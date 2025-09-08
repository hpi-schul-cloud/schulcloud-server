import { Loggable, LogMessage } from '@core/logger';

export class DeletedUserDataLoggable implements Loggable {
	constructor(private readonly userId: string) {}

	public getLogMessage(): LogMessage {
		const message = {
			message: `User data deleted from account collection`,
			data: { userId: this.userId },
		};

		return message;
	}
}
