import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type RoomArrangementConflictReason } from '../type/room-arrangement';

export class RoomArrangementConflictError extends BusinessError {
	constructor(public readonly reason: RoomArrangementConflictReason) {
		super(
			{
				type: 'ROOM_ARRANGEMENT_CONFLICT',
				title: 'Room arrangement conflict',
				defaultMessage: 'The room arrangement was changed in the meantime. Reload it and try again.',
			},
			HttpStatus.CONFLICT,
			{ reason }
		);
	}
}
