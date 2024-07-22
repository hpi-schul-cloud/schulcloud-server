import { BadRequestException } from '@nestjs/common';
import { ErrorLogMessage, Loggable } from '@src/core/logger';

export class CommonCartridgeManifestNotFoundException extends BadRequestException implements Loggable {
	constructor() {
		super('Manifest file not found.');
	}

	public getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'WRONG_FILE_FORMAT',
			stack: this.stack,
		};

		return message;
	}
}
