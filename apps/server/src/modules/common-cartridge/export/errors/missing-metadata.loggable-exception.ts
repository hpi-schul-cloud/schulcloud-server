import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, Loggable } from '@src/core/logger';
import { CommonCartridgeErrorEnum } from './error.enums';

export class MissingMetadataLoggableException extends InternalServerErrorException implements Loggable {
	constructor() {
		super({
			type: CommonCartridgeErrorEnum.MISSING_METADATA,
		});
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: CommonCartridgeErrorEnum.MISSING_METADATA,
			stack: this.stack,
			data: {
				message: 'Metadata is required',
			},
		};

		return message;
	}
}
