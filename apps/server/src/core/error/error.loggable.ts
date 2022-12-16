import { ApiValidationError } from '@shared/common';
import { ErrorLogMessage, ILoggable, ValidationErrorLogMessage } from '../logger/interfaces/loggable';
import { ErrorUtils } from './utils/error.utils';

export class ErrorLoggable implements ILoggable {
	error: Error;

	constructor(error: Error) {
		this.error = error;
	}

	getLogMessage() {
		let logMessage: ErrorLogMessage | ValidationErrorLogMessage = {
			error: this.error,
			stack: this.error.stack,
			type: 'Unhandled or Unknown Error',
		};

		if (ErrorUtils.isFeathersError(this.error)) {
			logMessage.type = 'Feathers Error';
		} else if (this.error instanceof ApiValidationError) {
			logMessage = this.writeValidationErrors(this.error);
		} else if (
			ErrorUtils.isBusinessError(this.error) ||
			(ErrorUtils.isNestHttpException(this.error) && this.error.getStatus() < 500)
		) {
			logMessage.type = 'Business Error';
		} else if (ErrorUtils.isNestHttpException(this.error)) {
			// IMO it is incorrect to classify all Nest HttpExceptions as technical errors, because they are often used as business errors,
			// e.g. the ForbiddenExceptions in the authorization service or the UnauthorizedException in the CurrentUser decorator.
			// As I understand the term "Technical Error" it would correspond to a 5xx status code. There are a few cases where we explicitly throw these.
			// We could filter for the status like above. Or we could get rid of the classification altogether. Is it really needed?
			logMessage.type = 'Technical Error';
		}

		return logMessage;
	}

	private writeValidationErrors = (error: ApiValidationError) => {
		const errorMsg = error.validationErrors.map(
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			(e) => `Wrong property ${e.property} got ${e.value} : ${JSON.stringify(e.constraints)}`
		);
		return {
			validationErrors: errorMsg,
			stack: error.stack,
			type: 'API Validation Error',
		};
	};
}
