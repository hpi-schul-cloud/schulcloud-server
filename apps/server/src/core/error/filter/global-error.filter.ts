import { ArgumentsHost, Catch, ExceptionFilter, HttpException, InternalServerErrorException } from '@nestjs/common';
import { ApiValidationError, BusinessError } from '@shared/common';
import { IError, RpcMessage } from '@shared/infra/rabbitmq/rpc-message';
import { ErrorLogger } from '@src/core/logger';
import { Loggable } from '@src/core/logger/interfaces/loggable';
import { Response } from 'express';
import _ from 'lodash';
import util from 'util';
import { ApiValidationErrorResponse, ErrorResponse } from '../dto';
import { ErrorLoggable } from '../error.loggable';
import { FeathersError } from '../interface';

@Catch()
export class GlobalErrorFilter<T extends IError | undefined> implements ExceptionFilter<T> {
	constructor(private logger: ErrorLogger) {}

	// eslint-disable-next-line consistent-return
	catch(error: T, host: ArgumentsHost): void | RpcMessage<unknown> {
		const contextType = host.getType<'http' | 'rmq'>();

		this.writeErrorLog(error);

		if (contextType === 'http') {
			const errorResponse = this.createErrorResponse(error);
			const ctx = host.switchToHttp();
			const response = ctx.getResponse<Response>();
			response.status(errorResponse.code).json(errorResponse);
		} else if (contextType === 'rmq') {
			return { message: undefined, error };
		}
	}

	private writeErrorLog = (error: unknown): void => {
		if (this.isInstanceOfLoggable(error)) {
			this.logger.error(error);
		} else if (error instanceof Error) {
			const loggable = new ErrorLoggable(error);
			this.logger.error(loggable);
		} else {
			this.logUnknownError(error);
		}
	};

	private isInstanceOfLoggable(object: any): object is Loggable {
		return 'getLogMessage' in object;
	}

	private logUnknownError(error: unknown): void {
		const unknownError = new Error(util.inspect(error));
		const loggable = new ErrorLoggable(unknownError);
		this.logger.error(loggable);
	}

	private createErrorResponse(error: unknown): ErrorResponse {
		try {
			if (error instanceof Error) {
				if (this.isFeathersError(error)) {
					// handles feathers errors only when calling feathers services from nest app
					return this.createErrorResponseForFeathersError(error);
				}
				if (this.isBusinessError(error)) {
					// create response from business error using 409/conflict
					return this.createErrorResponseForBusinessError(error);
				}
				if (this.isTechnicalError(error)) {
					// create response from technical error
					return this.createErrorResponseForHttpException(error);
				}
			}
			// create default response for all unknown errors
			return this.createErrorResponseForUnknownError();
		} catch (exception) {
			this.logUnknownError(exception);
			return this.createErrorResponseForUnknownError();
		}
	}

	private isFeathersError(error: Error): error is FeathersError {
		if (!(error && 'type' in error)) return false;
		return (error as FeathersError)?.type === 'FeathersError';
	}

	private isBusinessError(error: Error): error is BusinessError {
		return error instanceof BusinessError;
	}

	/**
	 * Compare helper to detect an error is a build in NestJS http exception.
	 * @param error
	 * @returns
	 */
	private isTechnicalError(error: Error): error is HttpException {
		return error instanceof HttpException;
	}

	private createErrorResponseForBusinessError(error: BusinessError): ErrorResponse {
		if (error instanceof ApiValidationError) {
			const response = new ApiValidationErrorResponse(error);
			return response;
		}
		const response = error.getResponse();
		return response;
	}

	private createErrorResponseForUnknownError(error?: unknown): ErrorResponse {
		const unknownError = new InternalServerErrorException(error);
		const response = this.createErrorResponseForHttpException(unknownError);
		return response;
	}

	/**
	 * Creates ErrorResponse from NestJS build in technical exceptions
	 * @param exception
	 * @returns {ErrorResponse}
	 */
	private createErrorResponseForHttpException(exception: HttpException): ErrorResponse {
		const code = exception.getStatus();
		const msg = exception.message || 'Some error occurred';
		const exceptionName = exception.constructor.name.replace('Loggable', '').replace('Exception', '');
		const type = _.snakeCase(exceptionName).toUpperCase();
		const title = _.startCase(exceptionName);
		return new ErrorResponse(type, title, msg, code);
	}

	private createErrorResponseForFeathersError(error: FeathersError) {
		const { code, className: type, name: title, message } = error;
		const snakeType = _.snakeCase(type).toUpperCase();
		const startTitle = _.startCase(title);
		return new ErrorResponse(snakeType, startTitle, message, code);
	}
}
