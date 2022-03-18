export interface ILogger {
	log(message: unknown, context?: string): unknown;
	error(message: unknown, trace?: string, context?: string): unknown;
	warn(message: unknown, context?: string): unknown;
	debug?(message: unknown, context?: string): unknown;
	verbose?(message: unknown, context?: string): unknown;
}
