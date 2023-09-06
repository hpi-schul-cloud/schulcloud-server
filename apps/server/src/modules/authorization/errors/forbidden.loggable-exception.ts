import { ForbiddenException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';
import { AuthorizationContext } from '../types';

export class ForbiddenLoggableException extends ForbiddenException implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly entityName: string,
		private readonly context: AuthorizationContext
	) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'FORBIDDEN_EXCEPTION',
			stack: this.stack,
			data: {
				userId: this.userId,
				entityName: this.entityName,
				action: this.context.action,
				requiredPermissions: this.context.requiredPermissions.join(','),
			},
			// TODO: cause is missing
		};

		return message;
	}
}
