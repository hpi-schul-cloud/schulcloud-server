import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Logger, RequestLoggingBody } from '@src/core/logger';
import { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ICurrentUser } from '@src/modules/authentication/interface/user';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
	constructor(private logger: Logger) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		this.logger.setContext(`${context.getClass().name}::${context.getHandler().name}()`);

		const req: Request = context.switchToHttp().getRequest();
		const currentUser = req.user as ICurrentUser;
		const logging: RequestLoggingBody = {
			userId: currentUser.userId,
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
				this.logger.http(logging);
			}),
			catchError((err: unknown) => {
				logging.error = err;
				this.logger.http(logging);
				return throwError(() => err);
			})
		);
	}
}
