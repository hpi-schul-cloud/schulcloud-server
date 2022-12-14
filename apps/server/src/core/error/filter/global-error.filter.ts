import { ArgumentsHost, Catch, ExceptionFilter, HttpException, InternalServerErrorException } from '@nestjs/common';
import { ApiValidationError, BusinessError } from '@shared/common';
import { IError, RpcMessage } from '@shared/infra/rabbitmq/rpc-message';
import { ErrorLogger } from '@src/core/logger';
import { ILoggable } from '@src/core/logger/interfaces/loggable';
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
			this.sendHttpResponse(error, host);
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

	private isInstanceOfLoggable(object: any): object is ILoggable {
		return 'getLogMessage' in object;
	}

	private logUnknownError(error: unknown): void {
		const unknownError = new Error(util.inspect(error));
		const loggable = new ErrorLoggable(unknownError);
		this.logger.error(loggable);
	}

	private sendHttpResponse(error: T, host: ArgumentsHost): void {
		const errorResponse = this.createErrorResponse(error);
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		response.status(errorResponse.code).json(errorResponse);
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
				if (this.isNestHttpException(error)) {
					// create response from technical error
					return this.createErrorResponseForNestHttpException(error);
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

	private isNestHttpException(error: Error): error is HttpException {
		return error instanceof HttpException;
	}

	private createErrorResponseForFeathersError(error: FeathersError) {
		const { code, className, name, message } = error;
		const type = _.snakeCase(className).toUpperCase();
		const title = _.startCase(name);
		return new ErrorResponse(type, title, message, code);
	}

	private createErrorResponseForBusinessError(error: BusinessError): ErrorResponse {
		if (error instanceof ApiValidationError) {
			const response = new ApiValidationErrorResponse(error);
			return response;
		}
		const response = error.getResponse();
		return response;
	}

	private createErrorResponseForNestHttpException(exception: HttpException): ErrorResponse {
		const code = exception.getStatus();
		const msg = exception.message || 'Some error occurred';
		const exceptionName = exception.constructor.name.replace('Loggable', '').replace('Exception', '');
		const type = _.snakeCase(exceptionName).toUpperCase();
		const title = _.startCase(exceptionName);
		return new ErrorResponse(type, title, msg, code);
	}

	private createErrorResponseForUnknownError(error?: unknown): ErrorResponse {
		const unknownError = new InternalServerErrorException(error);
		const response = this.createErrorResponseForNestHttpException(unknownError);
		return response;
	}
}
