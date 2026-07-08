import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class TspAccessTokenLoggableError extends BusinessError implements Loggable {
	constructor(private readonly error: Error) {
		super(
			{
				type: 'TSP_ACCESS_TOKEN_ERROR',
				title: 'The TSP access token could not be generated',
				defaultMessage: 'The TSP access token could not be generated during the sync',
			},
			HttpStatus.BAD_REQUEST
		);
	}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			message: this.message,
			type: this.type,
			stack: this.stack,
			error: this.error,
		};

		return message;
	}
}
