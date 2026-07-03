import { MediaSourceDataFormat } from '@modules/media-source';
import { NotImplementedException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class MediumMetadataStrategyNotImplementedLoggableException extends NotImplementedException implements Loggable {
	constructor(private readonly mediaSourceDataFormat: MediaSourceDataFormat) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			message: `The sync strategy for media source data format ${this.mediaSourceDataFormat} is not implemented or not registered.`,
			data: {
				mediaSourceDataFormat: this.mediaSourceDataFormat,
			},
		};
	}
}
