import { Loggable, LogMessage } from '@core/logger';

export class UpdatingLastFailedLoginLoggable implements Loggable {
	constructor(private readonly accountId: string) {}

	getLogMessage(): LogMessage {
		const message = {
			message: `Updating last tried failed login ...`,
			data: { accountId: this.accountId },
		};

		return message;
	}
}
