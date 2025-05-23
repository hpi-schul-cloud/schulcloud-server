import { Loggable, LogMessage } from '@core/logger';

export class SavingAccountLoggable implements Loggable {
	constructor(private readonly accountId: string) {}

	getLogMessage(): LogMessage {
		const message = {
			message: `Saving account ...`,
			data: { accountId: this.accountId },
		};

		return message;
	}
}
