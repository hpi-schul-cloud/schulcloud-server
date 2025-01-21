import { Loggable, LogMessage } from '@core/logger';

export class DeletingAccountLoggable implements Loggable {
	constructor(private readonly accountId: string) {}

	public getLogMessage(): LogMessage {
		const message = {
			message: `Deleting account ...`,
			data: { accountId: this.accountId },
		};

		return message;
	}
}
