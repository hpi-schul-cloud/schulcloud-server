import { Loggable, LogMessage } from '@src/core/logger';

export class FindAccountByDbcUserIdLoggable implements Loggable {
	constructor(private readonly userId: string) {}

	getLogMessage(): LogMessage {
		const message = {
			message: `Error while searching for account`,
			data: { userId: this.userId },
		};

		return message;
	}
}
