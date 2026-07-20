import { type ErrorLogMessage, type ValidationErrorLogMessage } from '../error/interfaces';

export type LogMessage = {
	message: string;
	data?: LogMessageData;
};

export type LoggableMessage = LogMessage | ErrorLogMessage | ValidationErrorLogMessage;

export interface Loggable {
	getLogMessage(): LoggableMessage;
}
