import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class BoardImportSourceDisabledLoggableException extends BusinessError implements Loggable {
	constructor(private readonly sourceType: string) {
		super(
			{
				type: 'BOARD_IMPORT_SOURCE_DISABLED',
				title: 'Board Import Source Disabled',
				defaultMessage: 'The import from this source is switched off at the moment.',
			},
			HttpStatus.FORBIDDEN
		);
	}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: this.type,
			stack: this.stack,
			data: {
				sourceType: this.sourceType,
			},
		};

		return message;
	}
}
