import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { IError, RpcMessage } from '@shared/infra/rabbitmq/rpc-message';
import { ErrorLogger } from '@src/core/logger';
import { Response } from 'express';
import { ErrorLoggingUtils } from '../utils/error-logging.utils';
import { ErrorResponseUtils } from '../utils/error-response.utils';

@Catch()
export class GlobalErrorFilter<T extends IError | undefined> implements ExceptionFilter<T> {
	constructor(private logger: ErrorLogger) {}

	// eslint-disable-next-line consistent-return
	catch(error: T, host: ArgumentsHost): void | RpcMessage<unknown> {
		const contextType = host.getType<'http' | 'rmq'>();

		const loggable = ErrorLoggingUtils.getLoggable(error);
		this.logger.error(loggable);

		if (contextType === 'http') {
			this.sendHttpResponse(error, host);
		} else if (contextType === 'rmq') {
			return { message: undefined, error };
		}
	}

	private sendHttpResponse(error: T, host: ArgumentsHost): void {
		const errorResponse = ErrorResponseUtils.createErrorResponse(error);
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		response.status(errorResponse.code).json(errorResponse);
	}
}
