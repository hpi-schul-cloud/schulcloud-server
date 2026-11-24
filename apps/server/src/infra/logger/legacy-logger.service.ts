import { Inject, Injectable, Scope } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import util from 'util';
import { Logger as WinstonLogger } from 'winston';
import { RequestLoggingBody } from './interfaces';
import { ILegacyLogger } from './interfaces/legacy-logger.interface';
import { LoggingUtils } from './logging.utils';

@Injectable({ scope: Scope.TRANSIENT })
/**
 * @deprecated The new logger for loggables should be used.
 * Default logger for server application.
 * Must implement ILegacyLogger but must not extend ConsoleLogger (this can be changed).
 * Transient injection: Wherever injected, a separate instance will be created, that can be provided with a custom context.
 */
export class LegacyLogger implements ILegacyLogger {
	/**
	 * This Logger Service can be injected into every Class,
	 * use setContext() with CustomProviderClass.name that will be added to every log.
	 * It implements @ILegacyLogger which provides the logger methods.
	 * CAUTION: PREPARE STRINGS AS LOG DATA, DO NOT LOG COMPLEX DATA STRUCTURES
	 */
	private context = '';

	constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger) {}

	public log(message: unknown, context?: string): void {
		this.logger.info(this.createMessage(message, context));
	}

	public warn(message: unknown, context?: string): void {
		this.logger.warning(this.createMessage(message, context));
	}

	public debug(message: unknown, context?: string): void {
		this.logger.debug(this.createMessage(message, context));
	}

	public http(message: RequestLoggingBody, context?: string): void {
		this.logger.notice(this.createMessage(message, context));
	}

	public error(message: unknown, trace?: unknown, context?: string): void {
		this.logger.error({ ...this.createMessage(message, context), trace: LoggingUtils.redactSensitiveValue(trace) });
	}

	public setContext(name: string): void {
		this.context = name;
	}

	private createMessage(message: unknown, context?: string): { message: string; context: string } {
		return { message: this.stringifiedMessage(message), context: context || this.context };
	}

	// Strings are logged as they are (util.inspect would wrap them in quotes), anything else as one line of text.
	private stringifiedMessage(message: unknown): string {
		const redactedMessage = LoggingUtils.redactSensitiveValue(message);
		if (typeof redactedMessage === 'string') {
			return redactedMessage;
		}

		return util.inspect(redactedMessage, { breakLength: Infinity });
	}
}
