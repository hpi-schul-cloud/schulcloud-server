import { Inject, Injectable, Scope } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import util from 'util';
import { Logger as WinstonLogger } from 'winston';
import { Loggable } from './interfaces/loggable';
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

	log(loggable: Loggable): void {
		this.logger.log('info', this.createMessage(loggable));
	}

	warn(loggable: Loggable): void {
		this.logger.warn(this.createMessage(loggable));
	}

	debug(loggable: Loggable): void {
		this.logger.debug(this.createMessage(loggable));
	}

	verbose(loggable: Loggable): void {
		this.logger.verbose(this.createMessage(loggable));
	}

	http(loggable: Loggable): void {
		this.logger.notice(this.createMessage(loggable));
	}

	error(loggable: Loggable): void {
		this.logger.error(this.createMessage(loggable));
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
