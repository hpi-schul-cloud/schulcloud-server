import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage, Loggable } from '@core/logger';
import { NotImplementedException } from '@nestjs/common';
import { MediaSourceDataFormat } from '@modules/media-source';

export class MediumMetadataStrategyNotImplementedLoggableException extends NotImplementedException implements Loggable {
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
