import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

export class RoomGroupNameDuplicateError extends BusinessError {
	constructor() {
		super(
			{
				type: 'ROOM_GROUP_NAME_DUPLICATE',
				title: 'Room group name duplicate',
				defaultMessage: 'Another room group of the user already has this name.',
			},
			HttpStatus.BAD_REQUEST,
			{ field: 'name' }
		);
	}
}
