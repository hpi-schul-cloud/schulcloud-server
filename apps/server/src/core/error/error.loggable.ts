import { ApiValidationError } from '@shared/common';
import { ErrorLogMessage, ILoggable, ValidationErrorLogMessage } from '../logger/interfaces/loggable.interface';
import { ErrorUtils } from './utils/error.utils';

export class ErrorLoggable implements ILoggable {
	constructor(private readonly error: Error) {}

	getLogMessage() {
		let logMessage: ErrorLogMessage | ValidationErrorLogMessage = {
			error: this.error,
			stack: this.error.stack,
			type: '',
		};

		if (this.error instanceof ApiValidationError) {
			logMessage = this.createLogMessageForValidationErrors(this.error);
		} else if (ErrorUtils.isFeathersError(this.error)) {
			logMessage.type = 'Feathers Error';
		} else if (ErrorUtils.isBusinessError(this.error)) {
			logMessage.type = 'Business Error';
		} else if (ErrorUtils.isNestHttpException(this.error)) {
			// IMO it is incorrect to classify all Nest HttpExceptions as technical errors, because they are often used as business errors,
			// e.g. the ForbiddenExceptions in the authorization service or the UnauthorizedException in the CurrentUser decorator.
			// As I understand the term "Technical Error" it would correspond to a 5xx status code. There are a few cases where we explicitly throw these.
			// We could filter for the status like above. Or we could get rid of the classification altogether. Is it really needed?
			logMessage.type = 'Technical Error';
		} else {
			logMessage.type = 'Unhandled or Unknown Error';
		}

		return logMessage;
	}

	private createLogMessageForValidationErrors = (error: ApiValidationError) => {
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
