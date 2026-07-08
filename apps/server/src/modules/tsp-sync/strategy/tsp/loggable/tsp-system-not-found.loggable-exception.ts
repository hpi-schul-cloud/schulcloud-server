import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

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

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			message: this.message,
			type: this.type,
			stack: this.stack,
		};

		return message;
	}
}
