import { RoomRole } from '@modules/role';
import { ForbiddenException } from '@nestjs/common';
import { ErrorLogMessage } from '@shared/common/error';
import { Loggable } from '@shared/common/loggable';

export class CantAssignRoomRoleToExternalPersonLoggableException extends ForbiddenException implements Loggable {
	constructor(private readonly props: { memberUserId: string; roomRole: RoomRole }) {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
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
