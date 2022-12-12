import { Loggable } from './loggable';

export type RequestLoggingBody = {
	userId?: string;
	request: { url: string; method: string; params: unknown; query: unknown };
	error: unknown | undefined;
};
export interface ILogger {
	http(loggable: Loggable): void;
	log(loggable: Loggable): void;
	warn(loggable: Loggable): void;
	debug(loggable: Loggable): void;
	verbose?(loggable: Loggable): void;
}

export interface IErrorLogger {
	error(loggable: Loggable): void;
}
