import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class BoardImportSourceUnknownLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'BOARD_IMPORT_SOURCE_UNKNOWN',
				title: 'Board Import Source Unknown',
				defaultMessage: 'The link does not point to a supported source.',
			},
			HttpStatus.BAD_REQUEST
		);
	}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: this.type,
			stack: this.stack,
		};

		return message;
	}
}
