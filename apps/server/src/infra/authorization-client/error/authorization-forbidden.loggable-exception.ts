import { ForbiddenException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { AuthorizationBodyParams } from '../authorization-api-client';

export class AuthorizationForbiddenLoggableException extends ForbiddenException implements Loggable {
	constructor(private readonly params: AuthorizationBodyParams) {
		super();
	}

	getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: 'FORBIDDEN_EXCEPTION',
			stack: this.stack,
			data: {
				action: this.params.context.action,
				referenceId: this.params.referenceId,
				referenceType: this.params.referenceType,
				requiredPermissions: this.params.context.requiredPermissions.join(','),
			},
		};

		return message;
	}
}
