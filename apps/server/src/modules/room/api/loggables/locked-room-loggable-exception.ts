import { ForbiddenException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class LockedRoomLoggableException extends ForbiddenException implements Loggable {
	constructor(
		private readonly title: string,
		private readonly id?: string
	) {
		super(title);
	}

	public getLogMessage(): LoggableMessage {
		const message = {
			type: 'LOCKED_ROOM',
			message: this.message,
			stack: this.stack,
			data: {
				id: this.id,
			},
		};

		return message;
	}
}
