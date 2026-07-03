import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@infra/logger';
import { MediaSourceDataFormat } from '@modules/media-source';
import { NotImplementedException } from '@nestjs/common';

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
