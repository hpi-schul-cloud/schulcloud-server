import {
	ArgumentsHost,
	BadRequestException,
	Catch,
	ExceptionFilter,
	HttpException,
	InternalServerErrorException,
} from '@nestjs/common';
import * as _ from 'lodash';
import { ServerLogger } from '../../logger/logger.service';
import { ErrorResponse } from '../dto/error.response';

import { BusinessError } from '../errors/business.error';
import { Response } from 'express';
import { ValidationError, ValidationErrorResponse } from '../dto/validation-error.response';
import { API_VALIDATION_ERROR_TYPE } from '../server-error-types';

const isValidationError = (error: HttpException): error is BadRequestException => {
	const { message } = error.getResponse() as any;
	return error instanceof BadRequestException && Array.isArray(message) && message.length > 0;
};

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
	// TODO create type and title by code, define types
	const { error } = exception.getResponse() as { error: string | undefined };
	const type = error || exception.message;
	return {
		code,
		type: _.snakeCase(type).toUpperCase(),
		title: _.startCase(type),
		message: exception.message,
	};
};

const getValidationErrorsFromBadRequestException = (error: BadRequestException) => {
	// expect error messages to be an array of strings
	const { message } = error.getResponse() as { message: string[] };
	const validationErrors = message.map((message) => {
		// messages have the related field by default in the first word, split up messages
		const firstWord = message.split(' ')[0];
		const rest = message.replace(firstWord + ' ', '');
		return new ValidationError(firstWord, rest);
	});
	return validationErrors;
};

const createErrorResponseForValidationError = (error: BadRequestException): ValidationErrorResponse => {
	const { title, type, defaultMessage } = API_VALIDATION_ERROR_TYPE;
	const response: ErrorResponse = { code: error.getStatus(), title, type, message: defaultMessage };
	const validationErrors = getValidationErrorsFromBadRequestException(error);
	return Object.assign({}, response, { validationErrors });
};

function createErrorResponseForBusinessError(error: BusinessError): ErrorResponse {
	throw new Error('Function not implemented.');
}

function createErrorResponseForUnknownError(error: any): ErrorResponse {
	const unknownError = new InternalServerErrorException(error);
	const response = createErrorResponseForHttpException(unknownError);
	return response;
}

const createErrorResponse = (error: any): ErrorResponse => {
	let errorResponse: ErrorResponse;
	if (isValidationError(error)) {
		// create response as validation error from 400/bad request exception
		errorResponse = createErrorResponseForValidationError(error);
	} else if (isBusinessError(error)) {
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
};

@Catch()
export class GlobalErrorFilter<T = any> implements ExceptionFilter<T> {
	private static readonly logger = new ServerLogger('Exception');

	catch(error: T, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		const errorResponse: ErrorResponse = createErrorResponse(error);
		response.status(errorResponse.code).json(errorResponse);
	}
}
