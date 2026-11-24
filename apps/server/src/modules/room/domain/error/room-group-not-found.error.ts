import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

export class RoomGroupNotFoundError extends BusinessError {
	constructor() {
		super(
			{
				type: 'ROOM_GROUP_NOT_FOUND',
				title: 'Room group not found',
				defaultMessage: 'The room group does not exist in the arrangement of the user.',
			},
			HttpStatus.NOT_FOUND
		);
	}
}
