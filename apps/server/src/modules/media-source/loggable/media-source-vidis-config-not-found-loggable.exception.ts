import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { NotFoundException } from '@nestjs/common';

export class MediaSourceVidisConfigNotFoundLoggableException extends NotFoundException {
	constructor(private readonly mediaSourceId: string, private readonly mediaSourceName: string) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Required vidis config of media source ${this.mediaSourceName} is missing.`,
			data: {
				mediaSourceId: this.mediaSourceId,
				mediaSourceName: this.mediaSourceName,
			},
		};
	}
}
