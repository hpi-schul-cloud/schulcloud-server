import { Loggable, LogMessage } from '@src/core/logger';

export class DeletedAccountWithUserIdLoggable implements Loggable {
	constructor(private readonly userId: string) {}

	getLogMessage(): LogMessage {
		const message = {
			message: `Account deleted`,
			data: { userId: this.userId },
		};

		return message;
	}
}
