import { Loggable, LogMessage } from '@src/core/logger';

export class UpdatedAccountUsernameLoggable implements Loggable {
	constructor(private readonly accountId: string) {}

	getLogMessage(): LogMessage {
		const message = {
			message: `Updated username`,
			data: { accountId: this.accountId },
		};

		return message;
	}
}
