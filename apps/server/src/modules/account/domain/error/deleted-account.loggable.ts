import { Loggable, LogMessage } from '@src/core/logger';

export class DeletedAccountLoggable implements Loggable {
	constructor(private readonly accountId: string) {}

	getLogMessage(): LogMessage {
		const message = {
			message: `Account deleted`,
			data: { accountId: this.accountId },
		};

		return message;
	}
}
