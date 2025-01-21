import { NotFoundException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class MediaSourceForSyncNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly mediaSourceName: string) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Unable to sync media school license, because media source cannot be found.',
			data: {
				mediaSourceName: this.mediaSourceName,
			},
		};
	}
}
