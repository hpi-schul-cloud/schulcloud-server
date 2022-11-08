export type RequestLoggingBody = {
	userId?: string;
	request: { url: string; method: string; params: unknown; query: unknown };
	error: unknown | undefined;
};
export interface ILogger {
	http(message: RequestLoggingBody, context?: string): void;
	log(message: unknown, context?: string): void;
	error(message: unknown, trace?: string, context?: string): void;
	warn(message: unknown, context?: string): void;
	debug(message: unknown, context?: string): void;
	verbose?(message: unknown, context?: string): void;
}
