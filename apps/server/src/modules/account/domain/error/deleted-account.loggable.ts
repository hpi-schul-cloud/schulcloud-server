import { Loggable, LogMessage } from '@core/logger';

export class DeletedAccountLoggable implements Loggable {
	constructor(private readonly accountId: string) {}

	public getLogMessage(): LogMessage {
		const message = {
			message: `Account deleted`,
			data: { accountId: this.accountId },
		};

		return message;
	}
}
