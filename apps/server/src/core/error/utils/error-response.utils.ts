import { HttpException, InternalServerErrorException } from '@nestjs/common';
import { ApiValidationError, BusinessError } from '@shared/common';
import _ from 'lodash';
import { ApiValidationErrorResponse, ErrorResponse } from '../dto';
import { FeathersError } from '../interface';
import { ErrorUtils } from './error.utils';

export class ErrorResponseUtils {
	static createErrorResponse(error: unknown): ErrorResponse {
		let response: ErrorResponse;

		if (ErrorUtils.isFeathersError(error)) {
			response = this.createErrorResponseForFeathersError(error);
		} else if (ErrorUtils.isBusinessError(error)) {
			response = this.createErrorResponseForBusinessError(error);
		} else if (ErrorUtils.isNestHttpException(error)) {
			response = this.createErrorResponseForNestHttpException(error);
		} else {
			response = this.createErrorResponseForUnknownError();
		}

		return response;
	}

	private static createErrorResponseForFeathersError(error: FeathersError) {
		const { code, className, name, message } = error;
		const type = _.snakeCase(className).toUpperCase();
		const title = _.startCase(name);

		return new ErrorResponse(type, title, message, code);
	}

	private static createErrorResponseForBusinessError(error: BusinessError): ErrorResponse {
		let response: ErrorResponse;

		if (error instanceof ApiValidationError) {
			response = new ApiValidationErrorResponse(error);
		} else {
			response = error.getResponse();
		}

		return response;
	}

	private static createErrorResponseForNestHttpException(exception: HttpException): ErrorResponse {
		const code = exception.getStatus();
		const msg = exception.message || 'Some error occurred';
		const exceptionName = exception.constructor.name.replace('Loggable', '').replace('Exception', '');
		const type = _.snakeCase(exceptionName).toUpperCase();
		const title = _.startCase(exceptionName);

		return new ErrorResponse(type, title, msg, code);
	}

	private static createErrorResponseForUnknownError(error?: unknown): ErrorResponse {
		const unknownError = new InternalServerErrorException(error);
		const response = this.createErrorResponseForNestHttpException(unknownError);

		return response;
	}
}
