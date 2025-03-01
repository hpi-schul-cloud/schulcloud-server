import { Loggable, LogMessage } from '@core/logger';

export class UpdatingAccountUsernameLoggable implements Loggable {
	constructor(private readonly accountId: string) {}

	getLogMessage(): LogMessage {
		const message = {
			message: `Updating username ...`,
			data: { accountId: this.accountId },
		};

		return message;
	}
}
