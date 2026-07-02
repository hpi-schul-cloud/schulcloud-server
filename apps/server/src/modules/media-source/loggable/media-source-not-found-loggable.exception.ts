import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@infra/logger';
import { NotFoundException } from '@nestjs/common';

export class MediaSourceNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly mediaSourceName: string) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Media source could not be found.`,
			data: {
				mediaSourceName: this.mediaSourceName,
			},
		};
	}
}
