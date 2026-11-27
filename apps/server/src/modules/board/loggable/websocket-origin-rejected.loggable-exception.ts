import { ForbiddenException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class WebsocketOriginRejectedLoggableException extends ForbiddenException implements Loggable {
	constructor(
		private readonly requestOrigin: string,
		private readonly expectedOrigin: string
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'WEBSOCKET_ORIGIN_REJECTED',
			stack: this.stack,
			data: { requestOrigin: this.requestOrigin, expectedOrigin: this.expectedOrigin },
		};
	}
}
