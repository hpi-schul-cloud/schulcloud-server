import { Loggable } from '@core/logger/interfaces';
import { ErrorLogMessage } from '@core/logger/types';
import { NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

export class UserToAddToRoomNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly userIds: EntityId[]) {
		super({
			type: 'USERS_TO_ADD_TO_ROOM_NOT_FOUND',
		});
	}

	public getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'USERS_TO_ADD_TO_ROOM_NOT_FOUND',
			stack: this.stack,
			data: {
				userIds: this.userIds.toString(),
			},
		};

		return message;
	}
}
