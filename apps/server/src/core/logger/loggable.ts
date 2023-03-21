import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from './types';

export abstract class Loggable {
	abstract getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage;
}
