import { ForbiddenException } from '@nestjs/common';
import { EntityId, IPermissionContext } from '@shared/domain';
import { ErrorLogMessage, Loggable } from '@src/core/logger/interfaces/loggable';

// This and the ForbiddenError are alternative implementations.
// I think LoggableForbiddenException is more expressive about what it is.
// ForbiddenError is more in line with our naming style because we always(?) use "error" instead of "exception".
// I (Max) tend to favor LoggableForbiddenException.
export class LoggableForbiddenException extends ForbiddenException implements Loggable {
	constructor(private userId: EntityId, private entityId: EntityId, private context: IPermissionContext) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const message = {
			type: 'FORBIDDEN_EXCEPTION',
			stack: this.stack,
			data: {
				userId: this.userId,
				entityId: this.entityId,
				action: this.context.action,
				requiredPermissions: this.context.requiredPermissions.join(','),
			},
		};

		return message;
	}
}
