import { BadRequestException } from '@nestjs/common';
import { ErrorLogMessage } from '@shared/common/error';
import { Loggable } from '@shared/common/loggable';

export class CantChangeOwnersRoleLoggableException extends BadRequestException implements Loggable {
	constructor(private readonly currentUserId: string, private readonly roomId: string) {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'CANT_CHANGE_OWNERS_ROLE',
			stack: this.stack,
			data: {
				currentUserId: this.currentUserId,
				roomId: this.roomId,
				errorMessage:
					'You cannot change the role of the room owner. If you want to change the owner, please transfer the ownership to another user instead.',
			},
		};

		return message;
	}
}
