import { HttpException } from '@nestjs/common';
import { ApiValidationError, BusinessError } from '@shared/common';
import { FeathersError } from '../../error/interface';
import { Loggable } from '../interfaces/loggable';

export class ErrorLoggable implements Loggable {
	error: Error;

	constructor(error: Error) {
		this.error = error;
	}

	private isFeathersError(error: Error): error is FeathersError {
		if (!(error && 'type' in error)) return false;
		return (error as FeathersError)?.type === 'FeathersError';
	}

	private isBusinessError(error: Error): error is BusinessError {
		return error instanceof BusinessError;
	}

	private isTechnicalError(error: Error): error is HttpException {
		return error instanceof HttpException;
	}

	private writeValidationErrors = (error: ApiValidationError) => {
		const errorMsg = error.validationErrors.map(
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			(e) => `Wrong property ${e.property} got ${e.value} : ${JSON.stringify(e.constraints)}`
		);
		return {
			message: errorMsg,
			stack: error.stack,
			type: 'API Validation Error',
		};
	};

	getLogMessage(): unknown {
		// what about unkown errors?
		if (this.isFeathersError(this.error)) {
			return {
				error: this.error,
				stack: this.error.stack,
				type: 'Feathers Error',
			};
		}
		if (this.isBusinessError(this.error)) {
			if (this.error instanceof ApiValidationError) {
				return this.writeValidationErrors(this.error);
			}
			return {
				error: this.error,
				stack: this.error.stack,
				type: 'Business Error',
			};
		}
		if (this.isTechnicalError(this.error)) {
			return {
				error: this.error,
				stack: this.error.stack,
				type: 'Technical Error',
			};
		}
		return {
			error: this.error,
			stack: this.error.stack,
			type: 'Unhandled or Unknown Error',
		};
	}
}
