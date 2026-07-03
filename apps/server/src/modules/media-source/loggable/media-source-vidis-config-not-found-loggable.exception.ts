import { NotFoundException } from '@nestjs/common';
import { LoggableMessage } from '@shared/common/loggable';

export class MediaSourceVidisConfigNotFoundLoggableException extends NotFoundException {
	constructor(
		private readonly mediaSourceId: string,
		private readonly mediaSourceName: string
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			message: `Required vidis config of media source ${this.mediaSourceName} is missing.`,
			data: {
				mediaSourceId: this.mediaSourceId,
				mediaSourceName: this.mediaSourceName,
			},
		};
	}
}
