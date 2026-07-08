import { ForbiddenException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class ExternalSystemLogoutIsDisabledLoggableException extends ForbiddenException implements Loggable {
	constructor() {
		super({
			type: 'FORBIDDEN_EXCEPTION',
			title: 'Forbidden access to feature',
			message: 'Feature flag for external system logout is not enabled',
		});
	}

	getLogMessage(): LoggableMessage {
		return {
			type: 'FORBIDDEN_EXCEPTION',
			message: 'Feature flag for external system logout is not enabled',
			stack: this.stack,
		};
	}
}
