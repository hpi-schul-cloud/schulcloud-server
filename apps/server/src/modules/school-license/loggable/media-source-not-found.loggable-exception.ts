import { NotFoundException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class MediaSourceNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly mediaSourceName: string) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Unable to fetch media school licenses, because media source cannot be found.',
			data: {
				mediaSourceName: this.mediaSourceName,
			},
		};
	}
}
