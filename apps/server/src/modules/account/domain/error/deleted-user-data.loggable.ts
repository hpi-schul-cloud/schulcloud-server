import { Loggable, LogMessage } from '@src/core/logger';

export class DeletedUserDataLoggable implements Loggable {
	constructor(private readonly userId: string) {}

	getLogMessage(): LogMessage {
		const message = {
			message: `User data deleted from account collection`,
			data: { userId: this.userId },
		};

		return message;
	}
}
