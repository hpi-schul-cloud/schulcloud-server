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

export type LogMessageWithContext = {
	message: string;
	context: string | undefined;
};

export type LogMessageData = LogMessageDataObject | string | number | undefined;

type LogMessageDataObject = {
	[key: string]: LogMessageData;
};
