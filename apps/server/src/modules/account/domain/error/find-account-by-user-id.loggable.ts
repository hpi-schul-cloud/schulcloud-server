import { Loggable, LogMessage } from '@core/logger';

export class FindAccountByDbcUserIdLoggable implements Loggable {
	constructor(private readonly userId: string) {}

	public getLogMessage(): LogMessage {
		const message = {
			message: `Error while searching for account`,
			data: { userId: this.userId },
		};

		return message;
	}
}
