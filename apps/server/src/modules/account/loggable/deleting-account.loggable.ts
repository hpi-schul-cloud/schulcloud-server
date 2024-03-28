import { Loggable, LogMessage } from '@src/core/logger';

export class DeletingAccountLoggable implements Loggable {
	constructor(private readonly accountId: string) {}

	getLogMessage(): LogMessage {
		const message = {
			message: `Deleting account ...`,
			data: { accountId: this.accountId },
		};

		return message;
	}
}
