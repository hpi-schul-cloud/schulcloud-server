import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class IDMLoginError implements Loggable {
	constructor(private readonly error: Error) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Error while trying to login via IDM',
			stack: this.error.stack,
			type: 'IDM_LOGIN_ERROR',
		};
	}
}
