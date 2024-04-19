import { BadRequestException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class MediaBoardElementAlreadyExistsLoggableException extends BadRequestException implements Loggable {
	constructor(private readonly mediaBoardId: EntityId, private readonly schoolExternalToolId: EntityId) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'MEDIA_BOARD_ELEMENT_ALREADY_EXISTS',
			message: 'Media element already exists on media board',
			stack: this.stack,
			data: {
				mediaBoardId: this.mediaBoardId,
				schoolExternalToolId: this.schoolExternalToolId,
			},
		};
	}
}
