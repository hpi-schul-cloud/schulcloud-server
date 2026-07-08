import { BadRequestException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class CantChangeOwnersRoleLoggableException extends BadRequestException implements Loggable {
	constructor(private readonly props: { currentUserId: string; roomId: string }) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: 'CANT_CHANGE_OWNERS_ROLE',
			stack: this.stack,
			data: {
				currentUserId: this.props.currentUserId,
				roomId: this.props.roomId,
				errorMessage:
					'You cannot change the role of the room owner. If you want to change the owner, please transfer the ownership to another user instead.',
			},
		};

		return message;
	}
}
