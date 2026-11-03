export type LogMessageWithContext = {
	message: string;
	context: string | undefined;
	[field: string]: unknown;
};
