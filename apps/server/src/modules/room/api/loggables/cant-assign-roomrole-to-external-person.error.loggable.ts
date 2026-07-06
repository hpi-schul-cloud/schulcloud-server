import { RoomRole } from '@modules/role';
import { ForbiddenException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class CantAssignRoomRoleToExternalPersonLoggableException extends ForbiddenException implements Loggable {
	constructor(private readonly props: { memberUserId: string; roomRole: RoomRole }) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: 'CANT_ASSIGN_ROOMROLE_TO_EXTERNAL_PERSON',
			stack: this.stack,
			data: {
				memberUserId: this.props.memberUserId,
				roomRole: this.props.roomRole,
				errorMessage: 'You cannot assign this role to an external person.',
			},
		};

		return message;
	}
}
