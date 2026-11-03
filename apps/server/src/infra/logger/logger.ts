import { Inject, Injectable, Optional, Scope } from '@nestjs/common';
import { INQUIRER, ModulesContainer } from '@nestjs/core';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { getLogOrigin } from './log-origin';
import { LoggingUtils } from './logging.utils';
import { LogData, LogMessageWithContext } from './types';

/**
 * Logs either a message with optional data, e.g. `logger.info('User created', { userId })`,
 * or a Loggable. Sensitive values are redacted in both cases.
 */
// The Loggable overloads come last: TypeScript uses the last overload for mocks and Parameters<>.
@Injectable({ scope: Scope.TRANSIENT })
export class Logger {
	private context: string;

	private readonly module?: string;

	/**
	 * The context defaults to the name of the class the logger is injected into (INQUIRER, works because the
	 * logger is transient), the module to the Nest module providing that class. setContext() overrides the context.
	 */
	constructor(
		@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
		@Optional() @Inject(INQUIRER) inquirer?: object | null,
		@Optional() modulesContainer?: ModulesContainer
	) {
		const { context, module } = getLogOrigin(inquirer, modulesContainer, (value) => value instanceof Logger);
		this.context = context;
		this.module = module;
	}

	/**
	 * For errors that are caught and handled, e.g. a failed retry. Thrown errors are logged by the global error filter.
	 */
	public error(message: string, data?: LogData): void;
	public error(loggable: Loggable): void;
	public error(messageOrLoggable: string | Loggable, data?: LogData): void {
		this.logger.error(this.createLogEntry(messageOrLoggable, data));
	}

	public warning(message: string, data?: LogData): void;
	public warning(loggable: Loggable): void;
	public warning(messageOrLoggable: string | Loggable, data?: LogData): void {
		this.logger.warning(this.createLogEntry(messageOrLoggable, data));
	}

	public notice(message: string, data?: LogData): void;
	public notice(loggable: Loggable): void;
	public notice(messageOrLoggable: string | Loggable, data?: LogData): void {
		this.logger.notice(this.createLogEntry(messageOrLoggable, data));
	}

	public info(message: string, data?: LogData): void;
	public info(loggable: Loggable): void;
	public info(messageOrLoggable: string | Loggable, data?: LogData): void {
		this.logger.info(this.createLogEntry(messageOrLoggable, data));
	}

	public debug(message: string, data?: LogData): void;
	public debug(loggable: Loggable): void;
	public debug(messageOrLoggable: string | Loggable, data?: LogData): void {
		this.logger.debug(this.createLogEntry(messageOrLoggable, data));
	}

	public setContext(name: string): void {
		this.context = name;
	}

	private createLogEntry(messageOrLoggable: string | Loggable, data?: LogData): LogMessageWithContext {
		const loggable =
			typeof messageOrLoggable === 'string'
				? { getLogMessage: (): LoggableMessage => ({ message: messageOrLoggable, data }) as LoggableMessage }
				: messageOrLoggable;

		const logEntry = LoggingUtils.createMessageWithContext(loggable, this.context);

		return this.module ? { ...logEntry, module: this.module } : logEntry;
	}
}
