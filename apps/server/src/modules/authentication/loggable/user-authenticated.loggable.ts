import { Loggable } from '@src/core/logger/interfaces';
import { LogMessage } from '@src/core/logger/types';

export class UserAuthenticatedLoggable implements Loggable {
	getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: 'SUCCESSFULLY_AUTHENTICATED',
			data: {},
		};

		return message;
	}
}
