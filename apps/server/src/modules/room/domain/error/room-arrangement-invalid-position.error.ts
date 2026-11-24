import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

export class RoomArrangementInvalidPositionError extends BusinessError {
	constructor() {
		super(
			{
				type: 'ROOM_ARRANGEMENT_INVALID_POSITION',
				title: 'Room arrangement invalid position',
				defaultMessage: 'The target position of the room is invalid.',
			},
			HttpStatus.BAD_REQUEST
		);
	}
}
