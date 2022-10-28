import { Inject, Injectable, Scope } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import util from 'util';
import { Logger as WinstonLogger } from 'winston';
import { IContextLogTransformer } from '../interfaces/context-log-transformer';
import { RequestLoggingBody } from './interfaces';
import { ILogger } from './interfaces/logger.interface';

@Injectable({ scope: Scope.TRANSIENT })
/**
 * Default logger for server application.
 * Must implement ILogger but must not extend ConsoleLogger (this can be changed).
 * Transient injection: Wherever injected, a separate instance will be created, that can be provided with a custom context.
 */
export class Logger implements ILogger {
	/**
	 * This Logger Service can be injected into every Class,
	 * use setContext() with CustomProviderClass.name that will be added to every log.
	 * It implements @ILogger which provides the logger methods.
	 * CAUTION: PREPARE STRINGS AS LOG DATA, DO NOT LOG COMPLEX DATA STRUCTURES
	 */
	private context = '';

	constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger) {}

	log(transformer: IContextLogTransformer): void {
		this.logger.log('info', transformer.getMessage());
	}

	warn(message: unknown, context?): void {
		if (typeof context === 'undefined' || typeof context === 'string') {
			this.logger.warn(this.createMessage(message, context));
		} else {
			this.logger.warn(this.createMessage(message));
		}
	}

	debug(message: unknown, context?: string | undefined): void {
		this.logger.debug(this.createMessage(message, context));
	}

	verbose(message: unknown, context?: string | undefined): void {
		this.logger.verbose(this.createMessage(message, context));
	}

	http(message: RequestLoggingBody, context?: string): void {
		this.logger.http(this.createMessage(message, context));
	}

	error(message: unknown, trace?: unknown, context?: string | undefined): void {
		const result = {
			message,
			trace,
		};
		this.logger.error(this.createMessage(result, context));
	}

	setContext(name: string) {
		this.context = name;
	}

	private createMessage(message: unknown, context?: string | undefined) {
		return { message: this.stringifiedMessage(message), context: context || this.context };
	}

	private stringifiedMessage(message: unknown) {
		const stringifiedMessage = util.inspect(message).replace(/\n/g, '').replace(/\\n/g, '');
		return stringifiedMessage;
	}
}
