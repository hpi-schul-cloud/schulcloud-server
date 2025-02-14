import { BadRequestException } from '@nestjs/common';
import { ErrorLogMessage } from '@shared/common/error';
import { Loggable } from '@shared/common/loggable';

export class CantPassOwnershipToUserNotInRoomLoggableException extends BadRequestException implements Loggable {
	constructor(private readonly props: { currentUserId: string; roomId: string; targetUserId: string }) {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'CANT_PASS_OWNERSHIP_TO_USER_NOT_IN_ROOM',
			stack: this.stack,
			data: {
				currentUserId: this.props.currentUserId,
				roomId: this.props.roomId,
				targetUserId: this.props.targetUserId,
				errorMessage: 'You cannot pass the ownership of the room to a user who is not a member of the room.',
			},
		};

		return message;
	}
}
