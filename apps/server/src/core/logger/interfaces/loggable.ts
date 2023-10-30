import { LogMessage, ErrorLogMessage, ValidationErrorLogMessage } from '../types/logging.types';

export interface Loggable {
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage;
}
