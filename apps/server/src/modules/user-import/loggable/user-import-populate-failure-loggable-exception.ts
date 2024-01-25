import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class UserImportPopulateFailureLoggableException extends BusinessError implements Loggable {
	constructor(private readonly url: string) {
		super(
			{
				type: 'USER_IMPORT_POPULATE_FAILURE',
				title: 'Fetching import user failed.',
				defaultMessage: 'While fetching import users an error occurred.',
			},
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'USER_IMPORT_POPULATE_FAILURE',
			message: 'While populate import users an error occurred.',
			stack: this.stack,
			data: {
				url: this.url,
			},
		};
	}
}
