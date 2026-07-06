import { NotFoundException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class MediumNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(
		private readonly mediumId: string,
		private readonly sourceId: string
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			message: `Medium could not be found.`,
			data: {
				sourceId: this.sourceId,
				mediumId: this.mediumId,
			},
		};
	}
}
