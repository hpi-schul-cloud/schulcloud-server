import { Injectable, Scope, Logger, LoggerService } from '@nestjs/common';

// Transient injection: Wherever injected, a separate instance will be created.
@Injectable({ scope: Scope.TRANSIENT })
// Must implement LoggerService but must not extend NestLogger (this can be changed)
export class ServerLogger extends Logger implements LoggerService {
	/**
	 * This Logger Service can be initialized with a context, that will be added to every log.
	 * It implements @LoggerService which provides the logger methods.
	 * CAUTION: PREPARE STRINGS AS LOG DATA, DO NOT LOG COMPLEX DATA STRUCTURES
	 * @param context when initialized in a provider, use setContext with CustomProviderClass.name
	 * @param isTimestampEnabled
	 */
	constructor(context?: string, isTimestampEnabled?: boolean) {
		super(context, isTimestampEnabled);
	}
}
