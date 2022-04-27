import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	constructor(private logger: Logger) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		this.logger.setContext(`${context.getClass().name}::${context.getHandler().name}()`);

		const req: Request = context.switchToHttp().getRequest();
		const logging = {
			user: req.user,
			request: {
				url: req.url,
				method: req.method,
				params: req.params,
				query: req.query,
			},
		};
		return next.handle().pipe(
			tap((data: unknown) => {
				Object.assign(logging, {
					response: {
						data,
					},
				});
				this.logger.log(`Request: ${JSON.stringify(logging)}`);
			}),
			catchError((err: unknown) => throwError(() => err))
		);
	}
}
