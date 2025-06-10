import { ErrorLogMessage, Loggable } from '@core/logger';
import { UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

export class H5pEditorContentInvalidIdLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly contentId: EntityId) {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
		return {
			type: 'H5P_EDITOR_CONTENT_INVALID_ID',
			stack: this.stack,
			data: {
				contentId: this.contentId,
			},
		};
	}
}
