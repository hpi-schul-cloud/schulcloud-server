import { InternalServerErrorException } from '@nestjs/common';
import { CommonCartridgeErrorEnum } from './error.enums';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class MissingMetadataLoggableException extends InternalServerErrorException implements Loggable {
	constructor() {
		super({
			type: CommonCartridgeErrorEnum.MISSING_METADATA,
		});
	}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: CommonCartridgeErrorEnum.MISSING_METADATA,
			stack: this.stack,
			data: {
				message: 'Metadata is required',
			},
		};

		return message;
	}
}
