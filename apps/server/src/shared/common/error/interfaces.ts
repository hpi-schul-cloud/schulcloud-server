import type { LogMessageDataObject } from '../loggable';

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
