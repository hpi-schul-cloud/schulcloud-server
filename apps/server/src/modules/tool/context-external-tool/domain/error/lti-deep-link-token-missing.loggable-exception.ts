import { UnauthorizedException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class LtiDeepLinkTokenMissingLoggableException extends UnauthorizedException implements Loggable {
	constructor(
		private readonly state: string,
		private readonly contextExternalToolId: EntityId
	) {
		super();
	}

	getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
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
