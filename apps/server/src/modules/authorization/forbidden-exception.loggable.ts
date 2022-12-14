import { EntityId, IPermissionContext } from '@shared/domain';
import { ILoggable, LogMessage } from '@src/core/logger/interfaces/loggable';
import { AllowedAuthorizationEntityType } from './interfaces';

export class ForbiddenExceptionLoggable implements ILoggable {
	userId: EntityId;

	entityName: AllowedAuthorizationEntityType;

	entityId: EntityId;

	context: IPermissionContext;

	constructor(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		context: IPermissionContext
	) {
		this.userId = userId;
		this.entityName = entityName;
		this.entityId = entityId;
		this.context = context;
	}

	getLogMessage(): LogMessage {
		return {
			message: 'Not authorized',
			data: {
				userId: this.userId,
				entityName: this.entityName,
				entityId: this.entityId,
				action: this.context.action,
				requiredPermission: this.context.requiredPermissions.join(','),
			},
		};
	}
}
