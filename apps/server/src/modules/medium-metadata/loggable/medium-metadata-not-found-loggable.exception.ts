import { NotFoundException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class MediumMetadataNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(
		private readonly mediumId: string,
		private readonly sourceId: string
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			message: `Medium metadata could not be found.`,
			data: {
				sourceId: this.sourceId,
				mediumId: this.mediumId,
			},
		};
	}
}
