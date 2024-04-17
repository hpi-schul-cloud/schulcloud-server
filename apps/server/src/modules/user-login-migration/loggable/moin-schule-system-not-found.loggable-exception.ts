import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { ValidationError } from '@shared/common';

export class MoinSchuleSystemNotFoundLoggableException extends ValidationError implements Loggable {
	constructor() {
		super('moin_schule_system_not_found: Cannot find moin.schule system');
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'MOIN_SCHULE_SYSTEM_NOT_FOUND',
			message: 'Cannot find moin.schule system',
			stack: this.stack,
		};
	}
}
