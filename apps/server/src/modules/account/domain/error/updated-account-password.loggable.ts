import { Loggable, LogMessage } from '@src/core/logger';

export class UpdatedAccountPasswordLoggable implements Loggable {
	constructor(private readonly accountId: string) {}

	getLogMessage(): LogMessage {
		const message = {
			message: `Updated password`,
			data: { accountId: this.accountId },
		};

		return message;
	}
}
