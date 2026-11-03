import { Inject, Injectable, Scope } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { LoggingUtils } from './logging.utils';
import { LogData, LogMessageWithContext } from './types';

/**
 * Logs either a message with optional data, e.g. `logger.info('User created', { userId })`,
 * or a Loggable. Sensitive values are redacted in both cases.
 */
// The Loggable overloads come last: TypeScript uses the last overload for mocks and Parameters<>.
@Injectable({ scope: Scope.TRANSIENT })
export class Logger {
	private context = '';

	constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger) {}

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

		return LoggingUtils.createMessageWithContext(loggable, this.context);
	}
}
