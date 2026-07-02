import { ErrorLogMessage, Loggable } from '@infra/logger';
import { BadRequestException } from '@nestjs/common';

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
