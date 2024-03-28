import { Loggable, LogMessage } from '@src/core/logger';

export class DeletingUserDataLoggable implements Loggable {
	constructor(private readonly userId: string) {}

	getLogMessage(): LogMessage {
		const message = {
			message: `Start deleting user data in account collection`,
			data: { userId: this.userId },
		};

		return message;
	}
}
