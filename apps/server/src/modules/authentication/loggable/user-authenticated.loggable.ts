import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class UserAuthenticatedLoggable implements Loggable {
	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			message: 'SUCCESSFULLY_AUTHENTICATED',
			data: {},
		};

		return message;
	}
}
