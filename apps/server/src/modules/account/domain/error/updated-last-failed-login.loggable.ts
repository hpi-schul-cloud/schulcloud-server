import { Loggable, LogMessage } from '@core/logger';

export class UpdatedLastFailedLoginLoggable implements Loggable {
	constructor(private readonly accountId: string) {}

	getLogMessage(): LogMessage {
		const message = {
			message: `Updated last tried failed login`,
			data: { accountId: this.accountId },
		};

		return message;
	}
}
