import { ArgumentsHost, Catch, ExceptionFilter, HttpException, InternalServerErrorException } from '@nestjs/common';
import { ApiValidationError, BusinessError } from '@shared/common';
import { IError, RpcMessage } from '@shared/infra/rabbitmq/rpc-message';
import { ErrorLogger, Loggable } from '@src/core/logger';
import { LoggingUtils } from '@src/core/logger/logging.utils';
import { Response } from 'express';
import _ from 'lodash';
import util from 'util';
import { ApiValidationErrorResponse, ErrorResponse } from '../dto';
import { FeathersError } from '../interface';
import { ErrorLoggable } from '../loggable/error.loggable';
import { ErrorUtils } from '../utils';

@Catch()
export class GlobalErrorFilter<T extends IError | undefined> implements ExceptionFilter<T> {
	constructor(private readonly logger: ErrorLogger) {}

	// eslint-disable-next-line consistent-return
	catch(error: T, host: ArgumentsHost): void | RpcMessage<unknown> {
		const loggable = this.createErrorLoggable(error);
		this.logger.error(loggable);

		const contextType = host.getType<'http' | 'rmq'>();

		if (contextType === 'http') {
			this.sendHttpResponse(error, host);
		} else if (contextType === 'rmq') {
			return { message: undefined, error };
		}
	}

	private createErrorLoggable(error: unknown): Loggable {
		let loggable: Loggable;

		if (LoggingUtils.isInstanceOfLoggable(error)) {
			loggable = error;
		} else if (error instanceof Error) {
			loggable = new ErrorLoggable(error);
		} else {
			const unknownError = new Error(util.inspect(error));
			loggable = new ErrorLoggable(unknownError);
		}

		return loggable;
	}

	private sendHttpResponse(error: T, host: ArgumentsHost): void {
		const errorResponse = this.createErrorResponse(error);
		const httpArgumentHost = host.switchToHttp();
		const response = httpArgumentHost.getResponse<Response>();
		response.status(errorResponse.code).json(errorResponse);
	}

	private createErrorResponse(error: unknown): ErrorResponse {
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

	private createErrorResponseForFeathersError(error: FeathersError) {
		const { code, className, name, message } = error;
		const type = _.snakeCase(className).toUpperCase();
		const title = _.startCase(name);

		return new ErrorResponse(type, title, message, code);
	}

	private createErrorResponseForBusinessError(error: BusinessError): ErrorResponse {
		let response: ErrorResponse;

		if (error instanceof ApiValidationError) {
			response = new ApiValidationErrorResponse(error);
		} else {
			response = error.getResponse();
		}

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

	private createErrorResponseForUnknownError(): ErrorResponse {
		const error = new InternalServerErrorException();
		const response = this.createErrorResponseForNestHttpException(error);

		return response;
	}
}
