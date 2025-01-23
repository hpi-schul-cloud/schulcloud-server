import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

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
