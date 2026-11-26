import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class BoardImportLinkInvalidLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'BOARD_IMPORT_LINK_INVALID',
				title: 'Board Import Link Invalid',
				defaultMessage: 'The link is not valid. Use the https share link of the board.',
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
