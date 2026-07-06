import { ErrorLogMessage, ValidationErrorLogMessage } from '../error';

export type LogMessageDataObject = {
	[key: string]: LogMessageData;
};

export type LogMessageData = LogMessageDataObject | string | number | boolean | undefined;

export type LogMessage = {
	message: string;
	data?: LogMessageData;
};

export type LoggableMessage = LogMessage | ErrorLogMessage | ValidationErrorLogMessage;

export interface Loggable {
	getLogMessage(): LoggableMessage;
}
