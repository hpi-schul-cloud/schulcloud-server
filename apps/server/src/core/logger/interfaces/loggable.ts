import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '../types';

// should be in shared or?
export interface Loggable {
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage;
}
