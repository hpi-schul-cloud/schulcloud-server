import { ArgumentsHost, Catch, ExceptionFilter, HttpException, InternalServerErrorException } from '@nestjs/common';
import { ApiValidationError, BusinessError } from '@shared/common';
import { IError, RpcMessage } from '@shared/infra/rabbitmq/rpc-message';
import { ILogger, Logger } from '@src/core/logger';
import { Response } from 'express';
import _ from 'lodash';
import { ApiValidationErrorResponse, ErrorResponse } from '../dto';
import { FeathersError } from '../interface';

const isFeathersError = (error: Error): error is FeathersError => {
	if (!(error && 'type' in error)) return false;
	return (error as FeathersError)?.type === 'FeathersError';
};

const isBusinessError = (error: Error): error is BusinessError => error instanceof BusinessError;

/**
 * Compare helper to detect an error is a build in NestJS http exception.
 * @param error
 * @returns
 */
const isTechnicalError = (error: Error): error is HttpException => error instanceof HttpException;

/**
 * Creates ErrorResponse from NestJS build in technical exceptions
 * @param exception
 * @returns {ErrorResponse}
 */
const createErrorResponseForHttpException = (exception: HttpException): ErrorResponse => {
	const code = exception.getStatus();
	const msg = exception.message || 'Some error occurred';
	const exceptionName = exception.constructor.name.replace('Exception', '');
	const type = _.snakeCase(exceptionName).toUpperCase();
	const title = _.startCase(exceptionName);
	return new ErrorResponse(type, title, msg, code);
};

function createErrorResponseForBusinessError(error: BusinessError): ErrorResponse {
	if (error instanceof ApiValidationError) {
		const response = new ApiValidationErrorResponse(error);
		return response;
	}
	const response = error.getResponse();
	return response;
}

function createErrorResponseForUnknownError(error?: unknown): ErrorResponse {
	const unknownError = new InternalServerErrorException(error);
	const response = createErrorResponseForHttpException(unknownError);
	return response;
}

function createErrorResponseForFeathersError(error: FeathersError) {
	const { code, className: type, name: title, message } = error;
	const snakeType = _.snakeCase(type).toUpperCase();
	const startTitle = _.startCase(title);
	return new ErrorResponse(snakeType, startTitle, message, code);
}

const createErrorResponse = (error: unknown, logger: ILogger): ErrorResponse => {
	try {
		if (error instanceof Error) {
			if (isFeathersError(error)) {
				// handles feathers errors only when calling feathers services from nest app
				return createErrorResponseForFeathersError(error);
			}
			if (isBusinessError(error)) {
				// create response from business error using 409/conflict
				return createErrorResponseForBusinessError(error);
			}
			if (isTechnicalError(error)) {
				// create response from technical error
				return createErrorResponseForHttpException(error);
			}
		}
		// create default response for all unknown errors
		return createErrorResponseForUnknownError();
	} catch (exception) {
		const stack = exception instanceof Error ? exception.stack : undefined;
		logger.error(exception, stack, 'Response Error');
		return createErrorResponseForUnknownError();
	}
};

const writeValidationErrors = (error: ApiValidationError, logger: ILogger) => {
	const errorMsg = error.validationErrors.map(
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		(e) => `Wrong property ${e.property} got ${e.value} : ${JSON.stringify(e.constraints)}`
	);
	logger.error(errorMsg, error.stack, 'API Validation Error');
};

const writeErrorLog = (error: unknown, logger: ILogger): void => {
	if (error instanceof Error) {
		if (isFeathersError(error)) {
			logger.error(error, error.stack, 'Feathers Error');
		} else if (isBusinessError(error)) {
			if (error instanceof ApiValidationError) {
				writeValidationErrors(error, logger);
			} else {
				logger.error(error, error.stack, 'Business Error');
			}
		} else if (isTechnicalError(error)) {
			logger.error(error, error.stack, 'Technical Error');
		} else {
			logger.error(error, error.stack, 'Unhandled Error');
		}
	} else {
		logger.error(error, 'Unknown error');
	}
};

@Catch()
export class GlobalErrorFilter<T extends IError | undefined> implements ExceptionFilter<T> {
	constructor(private logger: Logger) {
		this.logger.setContext('Error');
	}

	// eslint-disable-next-line consistent-return
	catch(error: T, host: ArgumentsHost): void | RpcMessage<unknown> {
		const contextType = host.getType<'http' | 'rmq'>();
		writeErrorLog(error, this.logger);
		const errorResponse: ErrorResponse = this.createErrorResponse(error);
		if (contextType === 'http') {
			const ctx = host.switchToHttp();
			const response = ctx.getResponse<Response>();
			response.status(errorResponse.code).json(errorResponse);
		} else if (contextType === 'rmq') {
			return { message: undefined, error };
		}
	}

	createErrorResponse(error: T): ErrorResponse {
		return createErrorResponse(error, this.logger);
	}
}
