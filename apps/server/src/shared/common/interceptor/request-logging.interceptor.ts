import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

type RequestLoggingBody = {
	user: unknown;
	request: { url: string; method: string; params: unknown; query: unknown };
	error: unknown | undefined;
};
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
	constructor(private logger: Logger) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		this.logger.setContext(`${context.getClass().name}::${context.getHandler().name}()`);

		const req: Request = context.switchToHttp().getRequest();
		const logging: RequestLoggingBody = {
			user: req.user,
			request: {
				url: req.url,
				method: req.method,
				params: req.params,
				query: req.query,
			},
			error: undefined,
		};
		return next.handle().pipe(
			tap(() => {
				this.sendToLogger(logging);
			}),
			catchError((err: unknown) => {
				logging.error = err;
				this.sendToLogger(logging);
				return throwError(() => err);
			})
		);
	}

	sendToLogger(logging: RequestLoggingBody) {
		const stringify = JSON.stringify(logging);
		if (logging.error) {
			this.logger.error(`Request: ${stringify}`);
		} else {
			this.logger.log(`Request: ${stringify}`);
		}
	}
}
