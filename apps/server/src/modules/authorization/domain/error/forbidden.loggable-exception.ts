import { ForbiddenException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';
import { type AuthorizationContext } from '../type';

export class ForbiddenLoggableException extends ForbiddenException implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly entityName: string,
		private readonly context: AuthorizationContext,
		readonly error?: unknown
	) {
		super('Forbidden', { cause: error });
	}

	getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: 'FORBIDDEN_EXCEPTION',
			stack: this.stack,
			data: {
				userId: this.userId,
				entityName: this.entityName,
				action: this.context.action,
				requiredPermissions: this.context.requiredPermissions.join(','),
			},
		};

		return message;
	}
}
