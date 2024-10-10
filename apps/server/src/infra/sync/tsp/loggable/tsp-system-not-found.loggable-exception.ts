import { HttpStatus } from '@nestjs/common';
import { BusinessError, ErrorLogMessage } from '@shared/common';
import { Loggable } from '@src/core/logger';

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

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: this.type,
			stack: this.stack,
		};

		return message;
	}
}
