import { ForbiddenException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type AuthorizationBodyParams } from '../generated';

export class AuthorizationErrorLoggableException extends ForbiddenException implements Loggable {
	constructor(
		private readonly error: unknown,
		private readonly params: AuthorizationBodyParams
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		const error = this.error instanceof Error ? this.error : new Error(JSON.stringify(this.error));
		const message: LoggableMessage = {
			type: AuthorizationErrorLoggableException.name,
			error,
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
