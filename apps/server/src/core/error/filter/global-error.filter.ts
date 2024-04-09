import { IError, RpcMessage } from '@infra/rabbitmq'; // TODO: Sollte core zugriff auf infra haben?
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, InternalServerErrorException } from '@nestjs/common';
import { ApiValidationError, BusinessError } from '@shared/common';
import { Response } from 'express';
import _ from 'lodash';
import { ApiValidationErrorResponse, ErrorResponse } from '../dto';
import { FeathersError } from '../interface';
import { ErrorUtils } from '../utils';
import { DomainErrorHandler } from '../domain';

@Catch()
export class GlobalErrorFilter<T extends IError | undefined> implements ExceptionFilter<T> {
	constructor(private readonly domainErrorHandler: DomainErrorHandler) {}

	// eslint-disable-next-line consistent-return
	catch(error: T, host: ArgumentsHost): void | RpcMessage<unknown> {
		this.domainErrorHandler.exec(error);

		const contextType = host.getType<'http' | 'rmq' | 'ws'>();

		if (contextType === 'http') {
			this.sendHttpResponse(error, host);
		}

		if (contextType === 'rmq') {
			// Ist der return wirklich notwendig?
			return this.sendRpcResponse(error);
		}

		if (contextType === 'ws') {
			// Nothing is implemented, only a placeholder!
			this.sendWsResponse();
		}
	}

	private sendHttpResponse(error: T, host: ArgumentsHost): void {
		const errorResponse = this.createErrorResponse(error);
		const httpArgumentHost = host.switchToHttp();
		const response = httpArgumentHost.getResponse<Response>();
		response.status(errorResponse.code).json(errorResponse);
	}

	private sendWsResponse(): void {
		// Nothing is implemented
	}

	// naming?
	private sendRpcResponse(error: T): RpcMessage<unknown> {
		return { message: undefined, error };
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

	private createErrorResponseForFeathersError(error: FeathersError): ErrorResponse {
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
