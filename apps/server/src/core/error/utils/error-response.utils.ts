import { HttpException, InternalServerErrorException } from '@nestjs/common';
import { ApiValidationError, BusinessError } from '@shared/common';
import _ from 'lodash';
import { ApiValidationErrorResponse, ErrorResponse } from '../dto';
import { FeathersError } from '../interface';
import { ErrorUtils } from './error.utils';

export class ErrorResponseUtils {
	static createErrorResponse(error: unknown): ErrorResponse {
		if (error instanceof Error) {
			if (ErrorUtils.isFeathersError(error)) {
				return this.createErrorResponseForFeathersError(error);
			}
			if (ErrorUtils.isBusinessError(error)) {
				return this.createErrorResponseForBusinessError(error);
			}
			if (ErrorUtils.isNestHttpException(error)) {
				return this.createErrorResponseForNestHttpException(error);
			}
		}
		return this.createErrorResponseForUnknownError();
	}

	private static createErrorResponseForFeathersError(error: FeathersError) {
		const { code, className, name, message } = error;
		const type = _.snakeCase(className).toUpperCase();
		const title = _.startCase(name);
		return new ErrorResponse(type, title, message, code);
	}

	private static createErrorResponseForBusinessError(error: BusinessError): ErrorResponse {
		if (error instanceof ApiValidationError) {
			const response = new ApiValidationErrorResponse(error);
			return response;
		}
		const response = error.getResponse();
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
