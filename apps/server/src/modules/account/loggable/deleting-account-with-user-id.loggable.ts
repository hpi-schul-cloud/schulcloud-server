import { Loggable, LogMessage } from '@src/core/logger';

export class DeletingAccountWithUserIdLoggable implements Loggable {
	constructor(private readonly userId: string) {}

	getLogMessage(): LogMessage {
		const message = {
			message: `Deleting account ...`,
			data: { userId: this.userId },
		};

		return message;
	}
}
