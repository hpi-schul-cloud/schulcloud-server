import { Inject, Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { ILoggerConfig, RequestLoggingBody } from './interfaces';
import { AvailableLogLevel, ILogger } from './interfaces/logger.interface';

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

	constructor(
		private readonly configService: ConfigService<ILoggerConfig, true>,
		@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
	) {
		const logLevels = this.configService.get<AvailableLogLevel[]>('AVAILABLE_LOG_LEVELS');
		// this.setLogLevels(logLevels as LogLevel[]);
	}

	log(message: unknown, context?: string | undefined): void {
		this.logger.log('info', message);
	}

	warn(message: unknown, context?: string | undefined): void {
		this.logger.warn(this.context, message);
	}

	debug(message: unknown, context?: string | undefined): void {
		this.logger.debug(this.context, message);
	}

	verbose(message: unknown, context?: string | undefined): void {
		this.logger.verbose(this.context, message);
	}

	http(message: RequestLoggingBody, context?: string): void {
		this.logger.http(this.context, message);
	}

	setContext(name: string) {
		this.context = name;
	}

	error(message: unknown, trace?: string[] | string | undefined, context?: string[] | string | undefined): void {
		this.logger.error(this.context, message);
	}
}
