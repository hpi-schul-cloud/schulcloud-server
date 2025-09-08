import { Loggable, LogMessage } from '@core/logger';

export class DeletingAccountWithUserIdLoggable implements Loggable {
	constructor(private readonly userId: string) {}

	public getLogMessage(): LogMessage {
		const message = {
			message: `Deleting account ...`,
			data: { userId: this.userId },
		};

		return message;
	}
}
