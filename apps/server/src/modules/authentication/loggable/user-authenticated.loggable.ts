import { Loggable, LogMessage } from '@infra/logger';

export class UserAuthenticatedLoggable implements Loggable {
	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: 'SUCCESSFULLY_AUTHENTICATED',
			data: {},
		};

		return message;
	}
}
