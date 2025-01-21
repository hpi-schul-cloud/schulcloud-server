import { Loggable, LogMessage } from '@core/logger';

export class DeletingUserDataLoggable implements Loggable {
	constructor(private readonly userId: string) {}

	public getLogMessage(): LogMessage {
		const message = {
			message: `Start deleting user data in account collection`,
			data: { userId: this.userId },
		};

		return message;
	}
}
