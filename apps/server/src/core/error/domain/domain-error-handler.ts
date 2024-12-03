import { Injectable } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { ErrorLogger, Loggable, LoggingUtils, LogMessageDataObject } from '@src/core/logger';
import { ICurrentUser } from '@src/infra/auth-guard';
import { Request } from 'express';
import util from 'util';
import axios from 'axios';
import { AxiosErrorLoggable, ErrorLoggable } from '../loggable';

@Injectable()
export class DomainErrorHandler {
	constructor(private readonly logger: ErrorLogger) {}

	public exec(error: unknown): void {
		const loggable = this.createErrorLoggable(error);
		this.logger.error(loggable);
	}

	public execHttpContext(error: unknown, context: HttpArgumentsHost): void {
		const request: Request = context.getRequest();
		const user = request.user as ICurrentUser | undefined;
		const requestInfo = {
			userId: user?.userId,
			request: {
				method: request.method,
				endpoint: request.url,
				params: JSON.stringify(request.params),
				query: JSON.stringify(request.query),
			},
		};
		const loggable = this.createErrorLoggable(error, requestInfo);

		this.logger.error(loggable);
	}

	private createErrorLoggable(error: unknown, data?: LogMessageDataObject): Loggable {
		let loggable: Loggable;

		if (LoggingUtils.isInstanceOfLoggable(error)) {
			loggable = error;
		} else if (axios.isAxiosError(error)) {
			loggable = new AxiosErrorLoggable(error, 'AXIOS_REQUEST_ERROR');
		} else if (error instanceof Error) {
			loggable = new ErrorLoggable(error, data);
		} else {
			const unknownError = new Error(util.inspect(error));
			loggable = new ErrorLoggable(unknownError, data);
		}

		return loggable;
	}
}
