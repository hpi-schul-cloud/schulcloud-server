import { UnprocessableEntityException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class BiloMediaQueryUnprocessableResponseLoggableException
	extends UnprocessableEntityException
	implements Loggable
{
	constructor() {
		super('Unprocessable or unexpected response from the media source');
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'BILO_MEDIA_QUERY_UNPROCESSABLE_RESPONSE',
			stack: this.stack,
			data: {
				message: 'The response body from bilo media query could not be processed',
			},
		};
	}
}
