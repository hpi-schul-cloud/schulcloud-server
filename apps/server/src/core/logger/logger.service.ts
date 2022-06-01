import { ConsoleLogger, Injectable, LogLevel, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ILoggerConfig, RequestLoggingBody } from './interfaces';
import { AvailableLogLevel, ILogger } from './interfaces/logger.interface';

@Injectable({ scope: Scope.TRANSIENT })
/**
 * Default logger for server application.
 * Must implement ILogger but must not extend ConsoleLogger (this can be changed).
 * Transient injection: Wherever injected, a separate instance will be created, that can be provided with a custom context.
 */
export class Logger extends ConsoleLogger implements ILogger {
	/**
	 * This Logger Service can be injected into every Class,
	 * use setContext() with CustomProviderClass.name that will be added to every log.
	 * It implements @ILogger which provides the logger methods.
	 * CAUTION: PREPARE STRINGS AS LOG DATA, DO NOT LOG COMPLEX DATA STRUCTURES
	 */
	constructor(private readonly configService: ConfigService<ILoggerConfig, true>) {
		super();
		const logLevels = this.configService.get<AvailableLogLevel[]>('AVAILABLE_LOG_LEVELS');
		this.setLogLevels(logLevels as LogLevel[]);
	}

	http(message: RequestLoggingBody, context?: string): void {
		const logLevel = 'http';
		if (!this.isLevelEnabled(logLevel as LogLevel)) {
			return;
		}
		this.printMessages([JSON.stringify(message)], context || this.context, 'HTTP Request' as LogLevel);
	}

	error(message: unknown, trace?: unknown, context?: string): void {
		this.printMessages(
			[JSON.stringify({message, trace: trace})],
			context || this.context,
			'HTTP Request' as LogLevel
		);
	}
}
