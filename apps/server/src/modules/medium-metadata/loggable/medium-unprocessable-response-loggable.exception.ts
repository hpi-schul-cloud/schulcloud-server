import { UnprocessableEntityException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class MediumUnprocessableResponseLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(
		private readonly mediumId: string,
		private readonly sourceId: string
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			message: `Media provider responded with unprocessable response.`,
			data: {
				sourceId: this.sourceId,
				mediumId: this.mediumId,
			},
		};
	}
}
