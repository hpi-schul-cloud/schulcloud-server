import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { NotFoundException } from '@nestjs/common';

export class MediaSourceNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly mediaSourceName: string) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Unable to fetch media school licenses, because media source cannot be found.',
			data: {
				mediaSourceName: this.mediaSourceName,
			},
		};
	}
}
