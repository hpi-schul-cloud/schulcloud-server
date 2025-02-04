import { NotFoundException } from '@nestjs/common';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class MediaSourceOauthConfigNotFoundLoggableException extends NotFoundException {
	constructor(private readonly mediaSourceId: string, private readonly mediaSourceName: string) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Required oauth config of media source ${this.mediaSourceName} is missing.`,
			data: {
				mediaSourceId: this.mediaSourceId,
				mediaSourceName: this.mediaSourceName,
			},
		};
	}
}
