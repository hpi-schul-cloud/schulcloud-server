import { NotFoundException } from '@nestjs/common';
import { type LoggableMessage } from '@shared/common/loggable';

export class MediaSourceOauthConfigNotFoundLoggableException extends NotFoundException {
	constructor(
		private readonly mediaSourceId: string,
		private readonly mediaSourceName: string
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			message: `Required oauth config of media source ${this.mediaSourceName} is missing.`,
			data: {
				mediaSourceId: this.mediaSourceId,
				mediaSourceName: this.mediaSourceName,
			},
		};
	}
}
