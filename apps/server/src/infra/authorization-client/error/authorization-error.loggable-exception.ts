import { ForbiddenException } from '@nestjs/common';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';
import { AuthorizationBodyParams } from '../authorization-api-client';

export class AuthorizationErrorLoggableException extends ForbiddenException implements Loggable {
	constructor(private readonly error: Error, private readonly params: AuthorizationBodyParams) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'INTERNAL_SERVER_ERROR',
			error: this.error,
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
