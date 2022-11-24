export interface Loggable {
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage;
}

export type LogMessage = {
	message: string;
	data?: { [key: string]: string | number | undefined };
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
