import { CallHandler, ExecutionContext, Injectable, NestInterceptor, RequestTimeoutException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/**
 * This interceptor leaves the request execution after a given timeout in ms.
 * This will not stop the running services behind the controller.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
	constructor(private readonly requestTimeout: number) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const reflector = new Reflector();
		const timeoutValue =
			reflector.get<number>('timeout', context.getHandler()) || reflector.get<number>('timeout', context.getClass());
		return next.handle().pipe(
			timeout(timeoutValue || this.requestTimeout),
			catchError((err: Error) => {
				if (err instanceof TimeoutError) {
					return throwError(() => new RequestTimeoutException());
				}
				return throwError(() => err);
			})
		);
	}
}
