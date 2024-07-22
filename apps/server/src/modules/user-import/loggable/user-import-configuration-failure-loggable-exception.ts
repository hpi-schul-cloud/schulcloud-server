import { HttpStatus } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { BusinessError } from '@shared/common';

export class UserImportConfigurationFailureLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'USER_IMPORT_CONFIGURATION_FAILURE',
				title: 'The user import configuration has a failure.',
				defaultMessage: 'Please check the user import configuration.',
			},
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'USER_IMPORT_CONFIGURATION_FAILURE',
			message: 'Please check the user import configuration.',
			stack: this.stack,
		};
	}
}
