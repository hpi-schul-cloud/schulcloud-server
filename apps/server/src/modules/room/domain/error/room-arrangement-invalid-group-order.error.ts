import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

export class RoomArrangementInvalidGroupOrderError extends BusinessError {
	constructor() {
		super(
			{
				type: 'ROOM_ARRANGEMENT_INVALID_GROUP_ORDER',
				title: 'Room arrangement invalid group order',
				defaultMessage: 'The group order must contain every group of the arrangement exactly once.',
			},
			HttpStatus.BAD_REQUEST
		);
	}
}
