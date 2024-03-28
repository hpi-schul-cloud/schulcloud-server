import { Loggable, LogMessage } from '@src/core/logger';

export class SavedAccountLoggable implements Loggable {
	constructor(private readonly accountId: string) {}

	getLogMessage(): LogMessage {
		const message = {
			message: `Account saved`,
			data: { accountId: this.accountId },
		};

		return message;
	}
}
