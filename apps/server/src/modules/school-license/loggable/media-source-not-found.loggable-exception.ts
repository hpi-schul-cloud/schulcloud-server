import { NotFoundException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class MediaSourceNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly mediaSourceName: string) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'Unable to fetch media school licenses, because media source cannot be found.',
			data: {
				mediaSourceName: this.mediaSourceName,
			},
		};
	}
}
