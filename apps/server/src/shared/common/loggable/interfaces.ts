import { type ErrorLogMessage, type ValidationErrorLogMessage } from '../error/interfaces';
import { type LogMessageData } from './log-message-data';

export type LogMessage = {
	message: string;
	data?: LogMessageData;
};

export type LoggableMessage = LogMessage | ErrorLogMessage | ValidationErrorLogMessage;

export interface Loggable {
	getLogMessage(): LoggableMessage;
}

export type { LogMessageData, LogMessageDataObject } from './log-message-data';
