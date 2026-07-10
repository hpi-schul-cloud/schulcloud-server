import { BadRequestException } from '@nestjs/common';
import { type ErrorLogMessage } from '@shared/common/error';
import { type Loggable } from '@shared/common/loggable';

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
