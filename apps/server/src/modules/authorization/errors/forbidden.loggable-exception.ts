import { ForbiddenException } from '@nestjs/common';
import { EntityId, IPermissionContext } from '@shared/domain';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';

export class ForbiddenLoggableException extends ForbiddenException implements Loggable {
	constructor(private userId: EntityId, private context: IPermissionContext) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const message = {
			type: 'FORBIDDEN_EXCEPTION',
			stack: this.stack,
			data: {
				userId: this.userId,
				// TODO: This is not easily possible atm because of the PermissionTypes, where id is optional in BaseDO.
				// entityId: this.entityId,
				action: this.context.action,
				requiredPermissions: this.context.requiredPermissions.join(','),
			},
		};

		return message;
	}
}
