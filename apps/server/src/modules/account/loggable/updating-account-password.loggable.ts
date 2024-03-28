import { Loggable, LogMessage } from '@src/core/logger';

export class UpdatingAccountPasswordLoggable implements Loggable {
	constructor(private readonly accountId: string) {}

	getLogMessage(): LogMessage {
		const message = {
			message: `Updating password ...`,
			data: { accountId: this.accountId },
		};

		return message;
	}
}
