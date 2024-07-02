import { ErrorLogMessage, ValidationErrorLogMessage } from '../error';

type LogMessageDataObject = {
	[key: string]: LogMessageData;
};

type LogMessageData = LogMessageDataObject | string | number | boolean | undefined;

type LogMessage = {
	message: string;
	data?: LogMessageData;
};

export type LoggableMessage = LogMessage | ErrorLogMessage | ValidationErrorLogMessage;

export interface Loggable {
	getLogMessage(): LoggableMessage;
}
