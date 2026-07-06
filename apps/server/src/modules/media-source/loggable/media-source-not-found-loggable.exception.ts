import { NotFoundException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class MediaSourceNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly mediaSourceName: string) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			message: `Media source could not be found.`,
			data: {
				mediaSourceName: this.mediaSourceName,
			},
		};
	}
}
