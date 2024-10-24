/**
 * Information inside this file should be placed in shared, type are copied to it.
 */
export type LogMessage = {
	message: string;
	data?: LogMessageData;
};

export type ErrorLogMessage = {
	error?: Error;
	type: string; // TODO: use enum
	stack?: string;
	data?: LogMessageDataObject;
};

export type ValidationErrorLogMessage = {
	validationErrors: string[];
	stack?: string;
	type: string; // TODO: use enum
};

export type LogMessageWithContext = {
	message: string;
	context: string | undefined;
};

export type LogMessageData = LogMessageDataObject | string | number | boolean | undefined;

export type LogMessageDataObject = {
	[key: string]: LogMessageData;
};
