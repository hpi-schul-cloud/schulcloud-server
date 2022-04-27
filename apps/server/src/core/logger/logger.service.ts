import { ConsoleLogger, Injectable, LogLevel, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ILoggerConfig } from './interfaces';
import { ILogger } from './interfaces/logger.interface';

@Injectable({ scope: Scope.TRANSIENT })
/**
 * Default logger for server application.
 * Must implement ILogger but must not extend ConsoleLogger (this can be changed).
 * Transient injection: Wherever injected, a separate instance will be created, that can be provided with a custom context.
 */
export class Logger extends ConsoleLogger implements ILogger {
	/**
	 * This Logger Service can be initialized with a context, that will be added to every log.
	 * It implements @ILogger which provides the logger methods.
	 * CAUTION: PREPARE STRINGS AS LOG DATA, DO NOT LOG COMPLEX DATA STRUCTURES
	 * @param context when initialized in a provider, use setContext with CustomProviderClass.name
	 * @param isTimestampEnabled
	 */
	constructor(context: string, private readonly configService: ConfigService<ILoggerConfig, true>) {
		super(context);
		const logLevels = this.configService.get<LogLevel[]>('LOG_LEVEL');
		this.setLogLevels(logLevels);
	}
}
