import { ErrorLogMessage, Loggable } from '@infra/logger';
import { BadRequestException } from '@nestjs/common';

export class CommonCartridgeResourceNotFoundException extends BadRequestException implements Loggable {
	constructor() {
		super('Resource not found.');
	}

	public getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'WRONG_FILE_FORMAT',
			stack: this.stack,
		};

		return message;
	}
}
