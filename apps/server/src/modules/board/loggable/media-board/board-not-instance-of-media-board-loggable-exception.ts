import { BadRequestException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class BoardNotInstanceOfMediaBoardLoggableException extends BadRequestException implements Loggable {
	constructor(private readonly mediaBoardId: EntityId) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'NOT_INSTANCE_OF_MEDIA_BOARD_',
			message: 'Board is not instance of media board',
			data: {
				mediaBoardId: this.mediaBoardId,
			},
		};
	}
}
