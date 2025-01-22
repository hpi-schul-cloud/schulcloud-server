import { Loggable, LogMessage } from '@core/logger';
import { HttpStatus } from '@nestjs/common';
import { BusinessError, ErrorLogMessage } from '@shared/common';

export class TspAccessTokenLoggableError extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'TSP_ACCESS_TOKEN_ERROR',
				title: 'The TSP access token could not be generated',
				defaultMessage: 'The TSP access token could not be generated during the sync',
			},
			HttpStatus.BAD_REQUEST
		);
	}

	public getLogMessage(): LogMessage | ErrorLogMessage {
		const message: LogMessage | ErrorLogMessage = {
			message: this.message,
			type: this.type,
			stack: this.stack,
		};

		return message;
	}
}
