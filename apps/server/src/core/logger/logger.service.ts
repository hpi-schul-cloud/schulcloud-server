import { Injectable, Scope, Logger } from '@nestjs/common';
import { ILogger } from './logger.interface';
@Injectable({ scope: Scope.TRANSIENT })
/**
 * Default logger for server application.
 * Must implement ILogger but must not extend NestLogger (this can be changed).
 * Transient injection: Wherever injected, a separate instance will be created, that can be provided with a custom context.
 */
export class ServerLogger extends Logger implements ILogger {
	/**
	 * This Logger Service can be initialized with a context, that will be added to every log.
	 * It implements @ILogger which provides the logger methods.
	 * CAUTION: PREPARE STRINGS AS LOG DATA, DO NOT LOG COMPLEX DATA STRUCTURES
	 * @param context when initialized in a provider, use setContext with CustomProviderClass.name
	 * @param isTimestampEnabled
	 */
	constructor(context?: string, isTimestampEnabled?: boolean) {
		super(context, isTimestampEnabled);
	}
}
