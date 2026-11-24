import { type ErrorLogMessage, type ValidationErrorLogMessage } from '../error';

export type LogMessageDataObject = {
	[key: string]: LogMessageData;
};

// Objects and arrays are logged as nested JSON, so there is no need to JSON.stringify data.
export type LogMessageData = LogMessageDataObject | LogMessageData[] | string | number | boolean | null | undefined;

export type LogMessage = {
	message: string;
	data?: LogMessageData;
};

export type LoggableMessage = LogMessage | ErrorLogMessage | ValidationErrorLogMessage;

export interface Loggable {
	getLogMessage(): LoggableMessage;
}
