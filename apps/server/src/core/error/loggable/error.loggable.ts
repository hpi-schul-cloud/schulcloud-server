import { ApiValidationError } from '@shared/common';
import { Loggable } from '../../logger/interfaces';
import { ErrorLogMessage, ValidationErrorLogMessage } from '../../logger/types';
import { ErrorUtils } from '../utils/error.utils';

export class ErrorLoggable implements Loggable {
	constructor(private readonly error: Error) {}

	getLogMessage(): ErrorLogMessage | ValidationErrorLogMessage {
		let logMessage: ErrorLogMessage | ValidationErrorLogMessage = {
			error: this.error,
			type: '',
		};

		if (this.error instanceof ApiValidationError) {
			logMessage = this.createLogMessageForValidationErrors(this.error);
		} else if (ErrorUtils.isFeathersError(this.error)) {
			logMessage.type = 'Feathers Error';
		} else if (ErrorUtils.isBusinessError(this.error)) {
			logMessage.type = 'Business Error';
		} else if (ErrorUtils.isNestHttpException(this.error)) {
			logMessage.type = 'Technical Error';
		} else {
			logMessage.type = 'Unhandled or Unknown Error';
		}

		return logMessage;
	}

	private createLogMessageForValidationErrors(error: ApiValidationError) {
		const errorMessages = error.validationErrors.map(
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			(e) => `Wrong property ${e.property} got ${e.value} : ${JSON.stringify(e.constraints)}`
		);
		return {
			validationErrors: errorMessages,
			stack: error.stack,
			type: 'API Validation Error',
		};
	}
}
