import { ForbiddenException } from '@nestjs/common';
import { EntityId, IPermissionContext } from '@shared/domain';
import { ErrorLogMessage, ILoggable } from '@src/core/logger/interfaces/loggable';

// This and the ForbiddenError are alternative implementations.
// There are two decisions to make here:
// 1) naming:
// 		I think LoggableForbiddenException is more expressive about what it is.
//		ForbiddenError is more in line with our naming style because we always/mostly(?) use "error" instead of "exception".
// 2) which class to extend:
//		Extending the pre-defined Nest HttpExceptions like ForbiddenException, we automatically stick to errors corresponding to the HTTP status codes.
//		Extending HttpException would basically do the same but less clear IMO.
//		Extending JavaScript's Error class, we would either need to add HTTP functionality ourself or otherwise map to HttpExceptions in some place (probably the error filter), which seems overly complicated.
// I (Max) favor LoggableForbiddenException extending ForbiddenException.
export class LoggableForbiddenException extends ForbiddenException implements ILoggable {
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
