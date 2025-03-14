import { ForbiddenException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Loggable } from '@core/logger/interfaces';
import { ErrorLogMessage } from '@core/logger/types';
import { AuthorizationContext } from '../type';

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
		};

		return message;
	}
}
