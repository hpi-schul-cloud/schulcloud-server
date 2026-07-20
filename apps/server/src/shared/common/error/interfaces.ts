import type { LogMessageDataObject } from '../loggable/log-message-data';

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

export interface ErrorType {
	readonly type: string;
	readonly title: string;
	readonly defaultMessage: string;
}

/**
 * HTTP response definition for errors.
 */
export interface InternalErrorResponse {
	/**
	 * Unambiguous error identifier, format: UPPERCASE_SNAKE_CASE
	 */
	readonly type: string;
	/**
	 * Description about the type, unique by type, format: Sentence case
	 */
	readonly title: string;
	/**
	 * Additional custom information about the error
	 */
	readonly message: string;
	/**
	 * Must match HTTP error code
	 */
	readonly code: number;
	/**
	 * Additional custom details about the error
	 */
	readonly details?: Record<string, unknown>;
}
