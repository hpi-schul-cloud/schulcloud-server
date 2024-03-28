import { Loggable, LogMessage } from '@src/core/logger';

export class GetOptionalIdmAccountLoggable implements Loggable {
	constructor(private readonly accountId: string) {}

	getLogMessage(): LogMessage {
		const message = {
			message: `Account ID could not be resolved. Creating new account and ID ...`,
			data: { accountId: this.accountId },
		};

		return message;
	}
}
