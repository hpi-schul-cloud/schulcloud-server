import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { Loggable, Logger, LogMessage, RequestLoggingBody } from '@src/core/logger';
import { ICurrentUser } from '@src/infra/auth-guard';
import { Request } from 'express';
import { catchError, Observable, throwError } from 'rxjs';
import { BusinessError, ErrorLogMessage, ValidationErrorLogMessage } from '../error';

function isLoggableError(error: unknown): error is BusinessError & Loggable {
	const isError = error instanceof BusinessError;
	const isLoggable =
		(error as Loggable).getLogMessage !== undefined && typeof (error as Loggable).getLogMessage === 'function';

	return isError && isLoggable;
}

class UnknownLoggableException extends BusinessError implements Loggable {
	constructor(private readonly error: unknown, private readonly request: RequestLoggingBody) {
		super(
			{
				type: 'INTERNAL_SERVER_ERROR',
				title: 'internal server error',
				defaultMessage: 'An internal server error occurred',
			},
			HttpStatus.INTERNAL_SERVER_ERROR,
			request,
			error
		);
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: this.message,
			error: this.error as Error,

			data: {
				request: this.request,
				error: this.error,
			},
		};
	}
}

@Injectable()
export class ErrorInterceptor implements NestInterceptor<unknown, unknown> {
	constructor(private readonly logger: Logger) {
		this.logger.setContext(ErrorInterceptor.name);
	}

	public intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
		const request: Request = context.switchToHttp().getRequest();
		const currentUser = request.user as ICurrentUser;
		const requestInfo: RequestLoggingBody = {
			userId: currentUser.userId,
			request: {
				url: request.url,
				method: request.method,
				params: request.params,
				query: request.query,
			},
			error: undefined,
		};

		return next.handle().pipe(
			catchError((error) => {
				if (isLoggableError(error)) {
					requestInfo.error = error.getLogMessage();
					this.logger.error(error);

					return throwError(() => error);
				}

				const exception = new UnknownLoggableException(error, requestInfo);

				requestInfo.error = exception.getLogMessage();
				this.logger.critical(exception);

				return throwError(() => exception);
			})
		);
	}
}
