import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { BusinessError } from '@shared/common';
import { HttpStatus } from '@nestjs/common';

export class MoinSchuleSystemNotFoundLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'MOIN_SCHULE_SYSTEM_NOT_FOUND',
				title: 'moin.schule system not found',
				defaultMessage: 'Cannot find moin.schule system',
			},
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
		};
	}
}
