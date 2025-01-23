import { Loggable, LogMessage } from '@core/logger';
import { HttpStatus } from '@nestjs/common';
import { BusinessError, ErrorLogMessage } from '@shared/common/error';

export class TspSystemNotFoundLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'TSP_SYSTEM_NOT_FOUND',
				title: 'The TSP system could not be found',
				defaultMessage: 'The TSP system could not be found during the sync',
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
