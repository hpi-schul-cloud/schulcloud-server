import { ILoggable } from './loggable';

export type RequestLoggingBody = {
	userId?: string;
	request: { url: string; method: string; params: unknown; query: unknown };
	error: unknown | undefined;
};
export interface ILogger {
	http(loggable: ILoggable): void;
	log(loggable: ILoggable): void;
	warn(loggable: ILoggable): void;
	debug(loggable: ILoggable): void;
	verbose?(loggable: ILoggable): void;
}

export interface IErrorLogger {
	error(loggable: ILoggable): void;
}
