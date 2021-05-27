import {
	ArgumentsHost,
	BadRequestException,
	Catch,
	ExceptionFilter,
	HttpException,
	InternalServerErrorException,
} from '@nestjs/common';
import * as _ from 'lodash';
import { Logger } from '../../logger/logger.service';
import { ErrorResponse } from '../dto/error.response';

import { BusinessError } from '../../../shared/error/business.error';
import { Response } from 'express';

const isBusinessError = (error): error is BusinessError => {
	return error instanceof BusinessError;
};

/**
 * Compare helper to detect an error is a build in NestJS http exception.
 * @param error
 * @returns
 */
const isTechnicalError = (error): error is HttpException => {
	return error instanceof HttpException;
};

/**
 * Creates ErrorResponse from NestJS build in technical exceptions
 * @param exception
 * @returns {ErrorResponse}
 */
const createErrorResponseForHttpException = (exception: HttpException): ErrorResponse => {
	const code = exception.getStatus();
	const { error } = exception.getResponse() as { error: string | undefined };
	const type = error || exception.message;
	return new ErrorResponse(_.snakeCase(type).toUpperCase(), _.startCase(type), exception.message, code);
};

function createErrorResponseForBusinessError(error: BusinessError): ErrorResponse {
	return error.getResponse() as any as ErrorResponse;
}

function createErrorResponseForUnknownError(error?: Error): ErrorResponse {
	const unknownError = new InternalServerErrorException(error);
	const response = createErrorResponseForHttpException(unknownError);
	return response;
}

const createErrorResponse = (error: any, logger: Logger): ErrorResponse => {
	try {
		let errorResponse: ErrorResponse;
		if (isBusinessError(error)) {
			// create response from business error using 409/conflict
			errorResponse = createErrorResponseForBusinessError(error);
		} else if (isTechnicalError(error)) {
			// create response from technical error
			errorResponse = createErrorResponseForHttpException(error);
		} else {
			// create response from unknown error
			errorResponse = createErrorResponseForUnknownError(error);
		}
		return errorResponse;
	} catch (exception) {
		logger.error(exception, exception?.stack, 'Error Response failed');
		return createErrorResponseForUnknownError();
	}
};

const writeErrorLog = (error: any, logger: Logger): void => {
	if (isBusinessError(error)) {
		// log error message only
		logger.error(error);
	} else if (isTechnicalError(error)) {
		// log error message only
		logger.error(error);
	} else {
		// full log with stack trace
		logger.error(error, error?.stack, 'Unhandled Error');
	}
};

@Catch()
export class GlobalErrorFilter<T = any> implements ExceptionFilter<T> {
	private static readonly logger = new Logger('Error');

	catch(error: T, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		writeErrorLog(error, GlobalErrorFilter.logger);
		const errorResponse: ErrorResponse = createErrorResponse(error, GlobalErrorFilter.logger);
		response.status(errorResponse.code).json(errorResponse);
	}
}
