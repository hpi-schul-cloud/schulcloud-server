import { NotImplementedException } from '@nestjs/common';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { MediaSourceDataFormat } from '@modules/media-source';

export class SyncStrategyNotImplementedLoggableException extends NotImplementedException {
	constructor(private readonly mediaSourceDataFormat: MediaSourceDataFormat) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `The sync strategy for media source data format ${this.mediaSourceDataFormat} is not implemented or not registered.`,
			data: {
				mediaSourceDataFormat: this.mediaSourceDataFormat,
			},
		};
	}
}
