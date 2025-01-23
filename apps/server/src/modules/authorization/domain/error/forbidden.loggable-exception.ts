import { ForbiddenException } from '@nestjs/common';
import type { EntityId } from '@shared/domain/types/entity-id';
import type { Loggable } from '@core/logger/interfaces/loggable';
import type { ErrorLogMessage } from '@core/logger/types/logging.types';
import type { AuthorizationContext } from '../type';

export class ForbiddenLoggableException extends ForbiddenException implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly entityName: string,
		private readonly context: AuthorizationContext
	) {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
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
