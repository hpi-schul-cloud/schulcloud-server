import { BadRequestException } from '@nestjs/common';
import { Constructor, EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { ColumnBoard, MediaBoard } from '../../domain';

export class InvalidBoardTypeLoggableException extends BadRequestException implements Loggable {
	constructor(
		private readonly expectedType: Constructor<MediaBoard | ColumnBoard>,
		private readonly mediaBoardId: EntityId
	) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'INVALID_BOARD_TYPE',
			message: 'Board does not have the expected type',
			stack: this.stack,
			data: {
				mediaBoardId: this.mediaBoardId,
				expectedType: this.expectedType.name,
			},
		};
	}
}
