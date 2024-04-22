import { IError, RpcMessage } from '@infra/rabbitmq';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, InternalServerErrorException } from '@nestjs/common';
import { ApiValidationError, BusinessError } from '@shared/common';
import { Response } from 'express';
import _ from 'lodash';
import { WsException } from '@nestjs/websockets';
import { ApiValidationErrorResponse, ErrorResponse } from '../dto';
import { FeathersError } from '../interface';
import { ErrorUtils } from '../utils';
import { DomainErrorHandler } from '../domain';

// We are receiving rmq instead of rpc and rmq is missing in context type.
// @nestjs/common export type ContextType = 'http' | 'ws' | 'rpc';
enum UseableContextType {
	http = 'http',
	rpc = 'rpc',
	ws = 'ws',
	rmq = 'rmq',
}

@Catch()
export class GlobalErrorFilter<E extends IError> implements ExceptionFilter<E> {
	constructor(private readonly domainErrorHandler: DomainErrorHandler) {}

	catch(error: E, host: ArgumentsHost): void | RpcMessage<undefined> | WsException {
		this.domainErrorHandler.exec(error);

		const contextType = host.getType<UseableContextType>();
		switch (contextType) {
			case UseableContextType.http:
				return this.sendHttpResponse(error, host);
			case UseableContextType.rpc:
			case UseableContextType.rmq:
				return this.sendRpcResponse(error);
			case UseableContextType.ws:
				return this.sendWsResponse(error);
			default:
				return undefined;
		}
	}

	private sendHttpResponse(error: E, host: ArgumentsHost): void {
		const errorResponse = this.createErrorResponse(error);
		const httpArgumentHost = host.switchToHttp();
		const response = httpArgumentHost.getResponse<Response>();
		response.status(errorResponse.code).json(errorResponse);
	}

	private sendRpcResponse(error: E): RpcMessage<undefined> {
		const rpcError = { message: undefined, error };

		return rpcError;
	}

	// 	// https://docs.nestjs.com/websockets/exception-filters
	private sendWsResponse(error: E): WsException {
		const wsError = new WsException(error);

		// TODO: Need to implemented an rewrite in correct way
		// const wsArgumentHost = host.switchToWs();
		// wsArgumentHost.getClient();

		return wsError;
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
