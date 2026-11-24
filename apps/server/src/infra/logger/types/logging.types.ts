export type LogMessageWithContext = {
	message: string;
	context: string | undefined;
	[field: string]: unknown;
};

// Any data can be passed, sensitive values are redacted before logging.
export type LogData = Record<string, unknown>;
