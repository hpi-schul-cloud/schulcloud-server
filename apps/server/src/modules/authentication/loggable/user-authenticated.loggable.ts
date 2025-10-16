import { Loggable } from '@core/logger/interfaces';
import { LogMessage } from '@core/logger/types';

export class UserAuthenticatedLoggable implements Loggable {
	getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: 'SUCCESSFULLY_AUTHENTICATED',
			data: {},
		};

		return message;
	}
}
