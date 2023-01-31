export interface ILoggable {
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage;
}

export type LogMessageData = LogMessageDataObject | string | number | undefined;

export type LogMessageDataObject = {
	[key: string]: LogMessageData;
};

export type LogMessage = {
	message: string;
	data?: LogMessageData;
};

export type ErrorLogMessage = {
	error?: Error;
	type: string; // TODO: use enum
	stack?: string;
	data?: { [key: string]: string | number | undefined };
};

export type ValidationErrorLogMessage = {
	validationErrors: string[];
	stack?: string;
	type: string; // TODO: use enum
};
