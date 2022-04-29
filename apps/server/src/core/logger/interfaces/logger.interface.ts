export type RequestLoggingBody = {
	userId?: string;
	request: { url: string; method: string; params: unknown; query: unknown };
	error: unknown | undefined;
};
export interface ILogger {
	http(message: RequestLoggingBody, context?: string): unknown;
	log(message: unknown, context?: string): unknown;
	error(message: unknown, trace?: string, context?: string): unknown;
	warn(message: unknown, context?: string): unknown;
	debug(message: unknown, context?: string): unknown;
	verbose?(message: unknown, context?: string): unknown;
}
