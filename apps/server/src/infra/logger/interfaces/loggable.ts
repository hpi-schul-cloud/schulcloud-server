import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '../types';

export interface Loggable {
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage;
}
