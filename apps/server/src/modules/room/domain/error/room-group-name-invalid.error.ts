import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type RoomGroupNameInvalidReason } from '../type/room-arrangement';

export class RoomGroupNameInvalidError extends BusinessError {
	constructor(public readonly reason: RoomGroupNameInvalidReason) {
		super(
			{
				type: 'ROOM_GROUP_NAME_INVALID',
				title: 'Room group name invalid',
				defaultMessage: 'The name of the room group is invalid.',
			},
			HttpStatus.BAD_REQUEST,
			{ field: 'name', reason }
		);
	}
}
