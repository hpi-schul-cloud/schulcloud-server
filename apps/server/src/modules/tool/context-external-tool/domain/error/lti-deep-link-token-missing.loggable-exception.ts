import { UnauthorizedException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class LtiDeepLinkTokenMissingLoggableException extends UnauthorizedException implements Loggable {
	constructor(private readonly state: string, private readonly contextExternalToolId: EntityId) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const message: LogMessage | ErrorLogMessage | ValidationErrorLogMessage = {
			type: 'UNAUTHORIZED_EXCEPTION',
			message: 'Unable to find lti deep link token for this state. It might have expired.',
			stack: this.stack,
			data: {
				state: this.state,
				contextExternalToolId: this.contextExternalToolId,
			},
		};

		return message;
	}
}
