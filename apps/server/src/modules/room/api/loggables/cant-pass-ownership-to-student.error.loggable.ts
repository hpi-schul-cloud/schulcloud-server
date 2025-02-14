import { BadRequestException } from '@nestjs/common';
import { ErrorLogMessage } from '@shared/common/error';
import { Loggable } from '@shared/common/loggable';

export class CantPassOwnershipToStudentLoggableException extends BadRequestException implements Loggable {
	constructor(private readonly props: { currentUserId: string; roomId: string; targetUserId: string }) {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'CANT_PASS_OWNERSHIP_TO_STUDENT',
			stack: this.stack,
			data: {
				currentUserId: this.props.currentUserId,
				roomId: this.props.roomId,
				targetUserId: this.props.targetUserId,
				errorMessage:
					'A student can not be owner of a room, since in that case the duty of supervision by a teacher could no longer be guaranteed.',
			},
		};

		return message;
	}
}
