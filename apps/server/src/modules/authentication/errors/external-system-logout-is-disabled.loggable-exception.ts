import { ForbiddenException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class ExternalSystemLogoutIsDisabledLoggableException extends ForbiddenException implements Loggable {
	constructor() {
		super({
			type: 'FORBIDDEN_EXCEPTION',
			title: 'Forbidden access to feature',
			message: 'Feature flag for external system logout is not enabled',
		});
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'FORBIDDEN_EXCEPTION',
			message: 'Feature flag for external system logout is not enabled',
			stack: this.stack,
		};
	}
}
