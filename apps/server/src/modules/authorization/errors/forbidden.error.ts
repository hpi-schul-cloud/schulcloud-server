import { HttpException, HttpStatus } from '@nestjs/common';
import { EntityId, IPermissionContext } from '@shared/domain';
import { ErrorLogMessage, ILoggable } from '@src/core/logger/interfaces/loggable.interface';

// This and the LoggableForbiddenException are alternative implementations.
// See LoggableForbiddenException for pros and cons.
export class ForbiddenError extends HttpException implements ILoggable {
	constructor(private userId: EntityId, private entityId: EntityId, private context: IPermissionContext) {
		super('Forbidden', HttpStatus.FORBIDDEN);
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
